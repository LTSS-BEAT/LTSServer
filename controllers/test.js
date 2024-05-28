require('dotenv').config();

const db = require('./testdb');
const axios = require('axios');
const util = require('util');

const LOADING_UNLOADING_TIME = 30;
const SPARE_TIME = 30;

let INITIAL_CANDIDATES_NUM = 5;

async function t (req, res, next) {

    let drivers = await getDrivers();
    let tasks = await getTasks();
    const drivers_backup = {...drivers};
      
    const numOfDriver = drivers.length;
    const numOfTasks = tasks.length;

    const iteration = Math.floor(numOfTasks/numOfDriver);

    for (let i = 0; i < iteration; i++) {
        await getAllTaskCandidates(drivers, tasks, INITIAL_CANDIDATES_NUM);
        if (distributeTasks(drivers, tasks)) {
            break;
        }
    }

};

async function distributeStep(drivers, tasks, taskCandidateNum) {
    // 후보의 수가 task의 수보다 많으면 해당 스텝의 결과로 실패 반환
    if (taskCandidateNum > tasks.length) {
        console.log('스텝 실패: taskCandidateNum > tasks.length'); //지워
        return false;
    }

    // driver에게 candidateNum수만큼의 task 후보 할당
    await getAllTaskCandidates(drivers, tasks, taskCandidateNum);
    // task 후보 중에서 모든 driver에게 겹치지 않게 후보 할당
    const distributeResult = distributeTasks(drivers, tasks);

    // 실패하면 후보의 수를 늘리고 다시 시도
    if (!distributeResult) {
        taskCandidateNum++;
        console.log(`후보수 ${taskCandidateNum}개로 분배 실패`); //지워
        distributeStep(drivers, tasks, taskCandidateNum);
    }

    // 성공 시
    // driver의 정보 업데이트
    updateAllDriverData(drivers);
    console.log('스텝 성공'); //지워
    return true;
}

function updateDistributeResult(drivers, tasks, distributeResult) {
    for (let [did, tid] of distributeResult) {
        const driver = drivers.find(driver => driver.did === did);
        const task = tasks.find(task => task.tid === tid);
        if (driver && task) {
            if (!Array.isArray(driver.assignedTasks)) {
                driver.assignedTasks = [];
            }
            driver.assignedTasks.push(task);
            const taskIndex = tasks.findIndex(task => task.tid === tid);
            if (taskIndex > -1) {
                tasks.splice(taskIndex, 1);
            }
        }
    }
}

async function getDrivers() {
    try {
        const driversQuery = util.promisify(db.query).bind(db);
        const driversResult = await driversQuery('SELECT * FROM driver');
        driversResult.forEach(driver => {
            driver.baseLon = driver.lon;
            driver.baseLat = driver.lat;
            driver.baseTime = 0;
            driver.taskCandidates = [];
            driver.taskCandidatesForDistribution = [];
            driver.assignedTasks = [];
            driver.taskTime = {};
        });
        return driversResult;

    } catch (error) {  
        console.error('Error:', error);
    }
}

async function getTasks() {

    function iterationTotasks(tasks) {
        tasks.forEach(task => {
            task.driverCandidates = [];
            task.distanceTodep = 0;
        });
    }

    try {
        const tasksQuery = util.promisify(db.query).bind(db);
        const tasksResult = await tasksQuery('SELECT * FROM task');
        await getTimeToDest(tasksResult);
        iterationTotasks(tasksResult)
        return tasksResult;

    } catch (error) {  
        console.error('Error:', error);
    }
}


async function getTimeToDest(tasks) {
    for (const task of tasks) {
        try {
            const params = {
                origin: `${task.dep_lon},${task.dep_lat}`,
                destination: `${task.dest_lon},${task.dest_lat}`
            };
        
            const headers = {
                'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
                'Content-Type': 'application/json'
            };
        
            const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
                params: params,
                headers: headers
            });
            
            const duration = response.data.routes[0].summary.duration;
            task.timeToDest = Math.ceil(duration / 60) + SPARE_TIME;
        } catch (error) {
            console.error('Error fetching task duration:', error);
        }
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0;

    const toRadians = angle => angle * (Math.PI / 180);
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;

    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance;
}

async function timeCheck(driver, task) {
    const {dep_time_min, dep_time_max, dest_time_min, dest_time_max} = task;
    const timeToDest = task.timeToDest;
    const baseTime = driver.baseTime;

    const params = {
        origin: `${driver.baseLon},${driver.baseLat}`,
        destination: `${task.dep_lon},${task.dep_lat}`
    };

    const headers = {
        'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json'
    };

    const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
        params: params,
        headers: headers
    });

    const timeToDep = Math.ceil((response.data.routes[0].summary.duration)/60) + SPARE_TIME;
    
    const arrivalTimeAtDep = baseTime + timeToDep;
    const completionTimeAtDep = arrivalTimeAtDep + LOADING_UNLOADING_TIME;
    const arrivalTimeAtDest = completionTimeAtDep + timeToDest;
    const completionTimeAtDest = arrivalTimeAtDest + LOADING_UNLOADING_TIME;
    
    if(completionTimeAtDep<=dep_time_max) {
        if(completionTimeAtDest<=dest_time_max) {
            driver.taskTime[task.tid] = {
                completionTimeAtDest,
                timeToDep
            };
            return true;
        }
    }
    return false;
}


async function getAllTaskCandidates(drivers, tasks, taskCandidatesNum) {

    async function getTaskCandidates(driver, tasks, taskCandidatesNum=INITIAL_CANDIDATES_NUM) {
    
        tasks.forEach(task => {
            const distance = getDistance(driver.baseLat, driver.baseLon, task.dep_lat, task.dep_lon);
            task.distance = distance;
            driver.taskCandidates.push(task);
        });
    
        driver.taskCandidates.sort((a, b) => a.distance - b.distance);
    
        let num = 0;
        let index = 0;
        while (num < taskCandidatesNum && index < driver.taskCandidates.length) {
            const timeCheckValue = await timeCheck(driver, driver.taskCandidates[index]);
            if (timeCheckValue) {
                num++;
                driver.taskCandidatesForDistribution.push(driver.taskCandidates[index])
            } 
            index++;
        }
    
        // // 할당된 후보를 taskCandidatesForDistribution에 추가
        // driver.taskCandidatesForDistribution = driver.taskCandidates.slice(0, taskCandidatesNum);
    
        console.log(`driver ${driver.did}의 후보 task:`); //지워
        console.log(driver.taskCandidatesForDistribution.map(task => task.tid)); //지워
        return;
    }

    if (tasks.length < taskCandidatesNum) {
        taskCandidatesNum = tasks.length;
    }

    for (const driver of drivers) {
        await getTaskCandidates(driver, tasks, taskCandidatesNum);
    }

}

function getDriverCandidates(drivers, task) {
    drivers.forEach(driver => {
        const distance = getDistance(driver.baseLat, driver.baseLon, task.dep_lat, task.dep_lon);
        driver.distanceTodep = distance;
        task.driverCandidates.push(driver);
    });
    task.driverCandidates.sort((a, b) => a.distanceTodep - b.distanceTodep);

    
}


function distributeTasks(drivers, tasks) {
    const allDistributions = [];

    // 각 드라이버에 대해 재귀적으로 탐색하여 가능한 모든 할당 방식을 생성하는 함수
    function exploreAssignments(driverIndex, assignedTasks, totalTimes) {
        if (driverIndex === drivers.length) {
            allDistributions.push({ assignedTasks, totalTimes });
            return;
        }

        for (const task of drivers[driverIndex].taskCandidatesForDistribution) {
            if (assignedTasks.some(t => t.tid === task.tid)) continue;
            const newAssignedTasks = [...assignedTasks, task];
            try {
                const newTotalTimes = [...totalTimes, drivers[driverIndex].taskTime[task.tid].timeToDep];
                exploreAssignments(driverIndex + 1, newAssignedTasks, newTotalTimes);

            } catch (error) {
                console.log(`error: ${driverIndex}번 driver에 ${task.tid}번 task 할당 불가`);
                console.log(`drivers: ${drivers}`);
            }
        }
    }

    exploreAssignments(0, [], []);

    if (allDistributions.length === 0) {
        return [];
    }

    allDistributions.sort((a, b) => {
        const totalA = a.totalTimes.reduce((acc, time) => acc + time, 0);
        const totalB = b.totalTimes.reduce((acc, time) => acc + time, 0);
        return totalA - totalB;
    });

    const bestResult = allDistributions[0];

    return drivers.map((driver, i) => [driver.did, bestResult.assignedTasks[i].tid]);
}




function updateAllDriverData(drivers) {

    function updateDriverData(driver) {
        const assignedTaskIndex = driver.assignedTasks.length - 1;
        const assignedLastTask = driver.assignedTasks[assignedTaskIndex];
        const assignedLastTaskId = assignedLastTask.tid;
    
        driver.baseLon = assignedLastTask.dest_lon;
        driver.baseLat = assignedLastTask.dest_lat;
        driver.baseTime = driver.taskTime[assignedLastTaskId].completionTimeAtDest;
        driver.taskCandidatesForDistribution = [];
        driver.taskCandidates = [];
        driver.taskTime = {};
    }

    for (const driver of drivers) {
        updateDriverData(driver);
    }
}

async function main () {
    let taskCandidatesNum = INITIAL_CANDIDATES_NUM;

    // driver와 task 정보 가져오기
    const drivers = await getDrivers();
    const tasks = await getTasks();
    
    // // driver와 task의 수
    // const numOfDriver = drivers.length;
    // const numOfTasks = tasks.length;
    // // driver와 task로 iteration 횟수 계산
    // const iterationNum = Math.floor(numOfTasks/numOfDriver);

    // getTaskCandidates(drivers[0], tasks);
    await getAllTaskCandidates(drivers, tasks, 5);
    const distributeResult = distributeTasks(drivers, tasks);
    console.log(JSON.stringify(distributeResult));
    updateDistributeResult(drivers, tasks, distributeResult);
    updateAllDriverData(drivers);

    await getAllTaskCandidates(drivers, tasks, 5);
    const distributeResult2 = distributeTasks(drivers, tasks);
    console.log(JSON.stringify(distributeResult2));
    updateDistributeResult(drivers, tasks, distributeResult2);
    updateAllDriverData(drivers);

    await getAllTaskCandidates(drivers, tasks, 5);
    const distributeResult3 = distributeTasks(drivers, tasks);
    console.log(JSON.stringify(distributeResult3));
    updateDistributeResult(drivers, tasks, distributeResult3);
    updateAllDriverData(drivers);


    console.log(drivers);
    console.log(tasks);
    db.end();
    return;

}


main()