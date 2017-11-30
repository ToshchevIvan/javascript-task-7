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
    const jobsQueue = jobs.map((job, index) => [index, job]);
    const results = [];
    let finishedCount = 0;

    function onJobFinish(outcome, jobIndex, resolve) {
        results[jobIndex] = outcome;
        finishedCount += 1;
        launchNextJob(resolve);
    }

    function launchNextJob(resolve) {
        if (finishedCount === jobs.length) {
            resolve(results);
        } else if (jobsQueue.length) {
            const [index, job] = jobsQueue.shift();
            const handler = outcome => onJobFinish(outcome, index, resolve);
            _waitFor(job, timeout).then(handler)
                .catch(handler);
        }
    }

    return new Promise(resolve => {
        if (parallelNum > 0) {
            [...Array(parallelNum)].forEach(() => launchNextJob(resolve));
        } else {
            resolve([]);
        }
    });
}

function _waitFor(job, timeout) {
    return new Promise((resolve, reject) => {
        job().then(resolve)
            .catch(reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout);
    });
}


