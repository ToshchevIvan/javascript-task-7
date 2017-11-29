'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    const jobsQueue = jobs
        .map((job, ind) => [ind, _waitFor(job, timeout)])
        .reverse();
    const results = [];
    const totalJobsCount = jobs.length;
    let pendingCount = 0;
    let finishedCount = 0;

    function onJobFinish(outcome, jobIndex, resolve) {
        results[jobIndex] = outcome;
        finishedCount += 1;
        pendingCount -= 1;
        launchNewJobs(resolve);
    }

    function launchNewJobs(resolve) {
        if (finishedCount === totalJobsCount) {
            resolve(results);

            return;
        }
        while (pendingCount < parallelNum && jobsQueue.length) {
            const [index, job] = jobsQueue.pop();
            const handler = outcome => onJobFinish(outcome, index, resolve);
            job.then(handler, handler);
            pendingCount += 1;
        }
    }

    return new Promise(resolve => launchNewJobs(resolve));
}

function _waitFor(promise, timeout) {
    return new Promise((resolve, reject) => {
        promise().then(resolve, reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout);
    });
}
