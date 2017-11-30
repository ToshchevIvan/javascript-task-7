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
    const jobsStack = jobs.map((j, index) => [index, _waitFor(j, timeout)]);
    const results = [];
    let launchedCount = 0;
    let finishedCount = 0;

    function onJobFinished(outcome, jobIndex, resolve) {
        results[jobIndex] = outcome;
        finishedCount += 1;
        launchJobs(resolve);
    }

    function launchJobs(resolve) {
        if (finishedCount === jobs.length || parallelNum <= 0) {
            resolve(results);

            return;
        }
        while (launchedCount - finishedCount < parallelNum && jobsStack.length) {
            const [index, job] = jobsStack.pop();
            const handler = outcome => onJobFinished(outcome, index, resolve);
            launchedCount += 1;
            job.then(handler)
                .catch(handler);
        }
    }

    return new Promise(launchJobs);
}

function _waitFor(job, timeout) {
    return new Promise((resolve, reject) => {
        job().then(resolve, reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout < 0 ? 0 : timeout);
    });
}
