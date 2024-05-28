require('dotenv').config();

const db = require('../db');
const axios = require('axios');
const util = require('util');

// 화물 상하차 시간 = 30분
const LOADING_UNLOADING_TIME = 30;
// 길찾기 api 결과값에 더할 여유 시간 = 30분
const SPARE_TIME = 30;

// driver에게 할당될 task의 후보 수
let INITIAL_CANDIDATES_NUM = 5;


// 메인 함수
module.exports = async (req, res, next) => {

    let taskCandidatesNum = INITIAL_CANDIDATES_NUM;

    // driver와 task 정보 가져오기
    const drivers = await getDrivers();
    const tasks = await getTasks();
    const tasks_backup = JSON.parse(JSON.stringify(tasks));
    
    // driver와 task의 수
    const numOfDriver = drivers.length;
    const numOfTasks = tasks.length;
    // driver와 task로 iteration 횟수 계산
    const iterationNum = Math.floor(numOfTasks/numOfDriver);

    // iteration 횟수만큼 반복
    for (let i = 0; i < iterationNum; i++) {
        distributeStep(drivers, tasks, taskCandidatesNum);
    }

};

async function distributeStep(drivers, tasks, taskCandidateNum) {
    // 후보의 수가 task의 수보다 많으면 해당 스텝의 결과로 실패 반환
    if (taskCandidateNum > tasks.length) {
        return false;
    }

    // driver에게 candidateNum수만큼의 task 후보 할당
    await getAllTaskCandidates(drivers, tasks, taskCandidateNum);
    // task 후보 중에서 모든 driver에게 겹치지 않게 후보 할당
    const distributeResult = distributeTasks(drivers, tasks);

    // 실패하면 후보의 수를 늘리고 다시 시도
    if (!distributeResult) {
        taskCandidateNum++;
        getAllTaskCandidates(drivers, tasks, taskCandidateNum);
    }

    // 성공 시
    // driver의 정보 업데이트
    updateAllDriverData(drivers);
    return true;
}

// 기본 반복 함수
async function defaultIteration(drivers, tasks, iterationNum) {
    if (iterationNum == 0) {
        return true;
    }
    if (candidationNum > tasks.length) {
        return false;
    }
    let candidationNum = INITIAL_CANDIDATES_NUM;

    // iterationNum만큼 반복
    for (let i = 0; i < iterationNum; i++) {
        // driver에게 task 후보 할당
        await getAllTaskCandidates(drivers, tasks, candidationNum);
        // task 후보 중에서 모든 driver에게 겹치지 않게 후보 할당
        const distributeResult = distributeTasks(drivers, tasks);
        if (!distributeResult) {
            candidationNum++;
            getAllTaskCandidates(drivers, tasks, candidationNum);
        }
    }

    for (const driver of drivers) {
        updateDriverData(driver);
    }

    if (tasks.length === 0) {
        return drivers;
    } else {
        return step();
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
            driver.assigedTasks = [];
            driver.taskCompletionTime = {};
        });
        return driversResult;

    } catch (error) {  
        console.error('Error:', error);
    }
}

async function getTasks() {
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

function iterationTotasks(tasks) {
    tasks.forEach(task => {
        task.driverCandidates = [];
        task.distanceTodep = 0;
    });

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
    const baseTime = driver.basetime;

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
            driver.taskCompletionTime[task.tid] = completionTimeAtDest;
            return true;
        }
    }
    return false;
}

async function getTaskCandidates(driver, tasks, numberOfCandidates) {
    tasks.forEach(task => {
        const distance = getDistance(driver.baseLat, driver.baseLon, task.dep_lat, task.dep_lon);
        task.distance = distance;
        driver.taskCandidates.push(task);
    });
    driver.taskCandidates.sort((a, b) => a.distance - b.distance);

    let num = 0;
    let index = 0;
    while (index < driver.taskCandidates.length) {
        const timeCheckValue = await timeCheck(driver, driver.taskCandidates[index]);
        if (timeCheckValue) {
            num++;
            index++;
        } else {
            driver.taskCandidates.splice(index, 1);
        } 

        if (num === numberOfCandidates) {
            break;
        }
    }
    
}

async function getAllTaskCandidates(drivers, tasks, numberOfCandidates) {
    if (tasks.length < numberOfCandidates) {
        numberOfCandidates = tasks.length;
    }

    for (const driver of drivers) {
        await getTaskCandidates(driver, tasks, numberOfCandidates);
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
    function backtrack(index) {
        if (index === drivers.length) {
            return true; // 모든 드라이버에게 작업 할당됨
        }

        const originalTasks = JSON.parse((JSON.stringify(tasks))); // 백업

        for (let i = 0; i < drivers[index].taskCandidates.length; i++) {
            const task = drivers[index].taskCandidates[i];

            if (!isTaskAssigned(drivers, task)) {
                drivers[index].assignedTasks.push(task); // 작업 할당
                const taskIndex = tasks.indexOf(task);
                if (taskIndex > -1) {
                    tasks.splice(taskIndex, 1); // tasks 배열에서 할당된 task 제거
                }

                if (backtrack(index + 1)) {
                    return true;
                }

                drivers[index].assignedTasks.pop(); // 백트래킹
                if (taskIndex > -1) {
                    tasks.splice(taskIndex, 0, task); // tasks 배열에 task 다시 추가
                }
            }
        }

        drivers[index].assignedTasks = originalTasks; // 백트래킹
        return false;
    }

    return backtrack(0);
}

function isTaskAssigned(drivers, task) {
    for (const driver of drivers) {
        if (driver.assignedTasks.includes(task)) {
            return true;
        }
    }
    return false;
}

function updateDriverData(driver) {
    driver.baseLon = driver.assigedTasks[assignTasks.length - 1].dest_lon;
    driver.baseLat = driver.assigedTasks[assignTasks.length - 1].dest_lat;
    driver.baseTime = driver.taskCompletionTime[driver.assigedTasks[assignTasks.length - 1].tid];
    driver.taskCandidates = [];
    driver.taskCompletionTime = {};
}

function updateAllDriverData(drivers) {
    for (const driver of drivers) {
        updateDriverData(driver);
    }
}