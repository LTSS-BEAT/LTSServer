require('dotenv').config();

const db = require('../db');
const axios = require('axios');
const util = require('util');

// 화물 상하차 시간 = 30분
const LOADING_UNLOADING_TIME = 30;
// 길찾기 api 결과값에 더할 여유 시간 = 30분
const SPARE_TIME = 0;

// 초기 후보 수
let INITIAL_CANDIDATES_NUM = 5;
let api_num = 0;


// 메인 함수
module.exports = async (req, res, next) => {
    console.time('Execution Time');

    const uid = req.body.uid? req.body.uid : 1;
    const base_date = req.body.selectedDate;
    console.log('Received date: ', base_date);
    try {
        // driver와 task 정보 가져오기
        const drivers = await getDrivers(uid);
        const tasks = await getTasks(uid, base_date);
        const tasks_backup = JSON.parse(JSON.stringify(tasks));
        
        // 우선 할당 작업 탐색
        const priorityTasks = getPriorityTasks(drivers, tasks);
    
        // driver와 task의 수
        const numOfDriver = drivers.length;
        const numOfTasks = tasks.length-priorityTasks.length;
        // driver와 task로 iteration 횟수 계산
        const iterationNum = Math.floor(numOfTasks/numOfDriver);
    
        // 우선 할당 작업 분배
        await getAllDriverCandidates(drivers, priorityTasks, 3);
        const priorityDistributeResult = distributeDrivers(drivers, priorityTasks);
        console.log(JSON.stringify(priorityDistributeResult));
        updateDistributeResult(drivers, priorityTasks, priorityDistributeResult);
        updateAllDriverData(drivers);
        console.log(`우선분배 스텝까지 api 호출 수: ${api_num}`);
    
    
        // iteration 횟수만큼 분배 과정 반복
        for (let i = 0; i < iterationNum; i++) {
            await getAllTaskCandidates(drivers, tasks, 5);
            const distributeResult = distributeTasks(drivers, tasks);
            console.log(JSON.stringify(distributeResult));
            updateDistributeResult(drivers, tasks, distributeResult);
            updateAllDriverData(drivers);
            console.log(`${i + 1}차 분배까지 api 호출 수: ${api_num}`);
        }
        // 남은 task 분배
        await getAllDriverCandidates(drivers, tasks, 8);
        const distributeResult3 = distributeDrivers(drivers, tasks);
        console.log(JSON.stringify(distributeResult3));
        updateDistributeResult(drivers, tasks, distributeResult3);
        console.log(`api 호출 수: ${api_num}`);
    
        const result = {};
        for (const driver of drivers) {
            result[driver.did] = driver.assignedTasks.map(task => task.tid);
        }
        console.log(result);
        updateDatabase(drivers, tasks);
        res.send({result});
        console.timeEnd('Execution Time');
    }
    catch (error) {
        res.sendStatus(500);
    }

};

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

async function getDrivers(uid) {
    try {
        const driversQuery = util.promisify(db.query).bind(db);
        const driversResult = await driversQuery('SELECT * FROM driver where uid = ?',[uid]);
        driversResult.forEach(driver => {
            driver.baseLon = driver.lon;
            driver.baseLat = driver.lat;
            driver.baseTime = 0;
            driver.distanceTodep = 0;
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

async function getTasks(uid, base_date) {

    function iterationTotasks(tasks) {
        tasks.forEach(task => {
            task.driverCandidates = [];
            task.driverCandidatesForDistribution = [];
            task.distanceTodep = 0;
        });
    }

    try {
        const tasksQuery = util.promisify(db.query).bind(db);
        const tasksResult = await tasksQuery('SELECT * FROM task where uid = ? and base_date = ?',[uid, base_date]);
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
            api_num++;//지워
            
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
    api_num++;//지워
    try{
        let timeToDep = 0;
        if (response.data.routes[0].result_code == 104) {
            timeToDep = SPARE_TIME;
        } else {
            timeToDep = Math.ceil((response.data.routes[0].summary.duration)/60) + SPARE_TIME;
        }
        // const timeToDep = Math.ceil((response.data.routes[0].summary.duration)/60) + SPARE_TIME;
        
        const arrivalTimeAtDep = Math.max(baseTime + timeToDep, dep_time_min);
        const completionTimeAtDep = arrivalTimeAtDep + LOADING_UNLOADING_TIME;
        const arrivalTimeAtDest = Math.max(completionTimeAtDep + timeToDest, dest_time_min);
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

    } catch (error) {
        console.error(`driver${driver.did}와 task${task.tid}간의 시간 계산 실패`);
        console.log(response.data);
    }   
    
}

async function getAllTaskCandidates(drivers, tasks, taskCandidatesNum=INITIAL_CANDIDATES_NUM) {
    tasks = tasks.filter(task => !drivers.some(driver => driver.assignedTasks.some(assignedTask => assignedTask.tid === task.tid)));

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


async function getAllDriverCandidates(drivers, tasks, driverCandidiatesNum=INITIAL_CANDIDATES_NUM) {
    async function getDriverCandidates(drivers, task, driverCandidiatesNum=INITIAL_CANDIDATES_NUM) {
        drivers.forEach(driver => {
            const distance = getDistance(driver.baseLat, driver.baseLon, task.dep_lat, task.dep_lon);
            driver.distanceToDep = distance;
            task.driverCandidates.push(driver);
        });

        task.driverCandidates.sort((a, b) => a.distanceToDep - b.distanceToDep);

        let num = 0;
        let index = 0;
        while (num < driverCandidiatesNum && index < task.driverCandidates.length) {
            const timeCheckValue = await timeCheck(task.driverCandidates[index], task);
            if (timeCheckValue) {
                num++;
                task.driverCandidatesForDistribution.push(task.driverCandidates[index]);
            } 
            index++;
        }
        // // 할당된 후보를 taskCandidatesForDistribution에 추가
        // driver.taskCandidatesForDistribution = driver.taskCandidates.slice(0, taskCandidatesNum);
    
        console.log(`task ${task.tid}의 후보 driver: ${num}개`); //지워
        console.log(task.driverCandidatesForDistribution.map(driver => driver.did)); //지워
        return;
    }

    if (drivers.length < driverCandidiatesNum) {
        driverCandidiatesNum = drivers.length;
    }
    for (const task of tasks) {
        await getDriverCandidates(drivers, task, driverCandidiatesNum);
    }
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

function distributeDrivers(drivers, tasks) {
    const allDistributions = [];

    // 각 드라이버에 대해 재귀적으로 탐색하여 가능한 모든 할당 방식을 생성하는 함수
    function exploreAssignments(taskIndex, assignedDrivers, totalTimes) {
        if (taskIndex === tasks.length) {
            allDistributions.push({ assignedDrivers, totalTimes });
            return;
        }

        for (const driver of tasks[taskIndex].driverCandidatesForDistribution) {
            if (assignedDrivers.some(d => d.did === driver.did)) continue;
            const newAssignedDrivers = [...assignedDrivers, driver];
            try {
                const newTotalTimes = [...totalTimes, driver.taskTime[tasks[taskIndex].tid].timeToDep];
                exploreAssignments(taskIndex + 1, newAssignedDrivers, newTotalTimes);

            } catch (error) {
                console.log(`error: ${taskIndex}번 task에 ${driver.did}번 driver 할당 불가`);
                console.log(`tasks: ${tasks}`);
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

    return tasks.map((task, i) => [bestResult.assignedDrivers[i].did, task.tid]);
}




function updateAllDriverData(drivers) {

    function updateDriverData(driver) {
        if(driver.assignedTasks.length==0) return;
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

function getLeastPriorityTasks(drivers, tasks) {
    const result = [];
    for(const task of tasks) {
        if (task.dest_time_max > 1440) {
            result.push(task);
            const index = tasks.findIndex(t => t.tid === task.tid);
            tasks.splice(index, 1);
        }
    }
    return result;
}

function getPriorityTasks(drivers, tasks) {
    const result = [];
    for(const task of tasks) {
        if (task.dest_time_max <= 840) {
            result.push(task);
            const index = tasks.findIndex(t => t.tid === task.tid);
            tasks.splice(index, 1);
        }
    }
    return result;
}

function updateDatabase(drivers, tasks) {
    const query = 'UPDATE task SET did = ?, sequence = ? WHERE tid = ?';
    for (const driver of drivers) {
        for (let i = 0; i < driver.assignedTasks.length; i++) {
            db.query(query, [driver.did, i, driver.assignedTasks[i].tid]);
        }
    }
}