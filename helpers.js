const fs = require('fs');
const path = require('path');
const os = require('os');
const process = require('process');
const { Worker } = require('worker_threads');
const { pgn2json } = require('chess-pgn-parser');

const userCPUCount = os.cpus().length;
const workerPath = path.resolve('pgn-worker.js');
const NS_PER_SEC = 1e9;

exports.getJSONWithWorker = function (pgns) {
    const segmentSize = Math.ceil(pgns.length / userCPUCount);
    const segments = [];

    for (let segmentIndex = 0; segmentIndex < userCPUCount; segmentIndex++) {
        const start = segmentIndex * segmentSize;
        const end = start + segmentSize;
        const segment = pgns.slice(start, end);
        segments.push(segment);
    }

    var promises = segments.map(
        segment =>
            new Promise((resolve, reject) => {
                const worker = new Worker(workerPath, {
                    workerData: segment,
                });
                worker.on('message', resolve);
                worker.on('error', reject);
                worker.on('exit', code => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                });
            })
    );

    return Promise.all(promises).then(objects => {
        var jsonGames = [];
        objects.forEach(object => jsonGames.push(object));
        fs.writeFileSync('games-threaded.json', JSON.stringify(jsonGames, null, 4));
    });
}

exports.getJSONWithoutWorker = function (pgns) {
    var obj = pgns.map(pgn => JSON.parse(pgn2json(pgn)));
    fs.writeFileSync('games.json', JSON.stringify(obj, null, 4));
}

exports.benchmark = async function (func, arg, label) {
    var start, diff;
    start = process.hrtime();
    await func(arg);
    diff = process.hrtime(start);
    console.log(`${label}: ${diff[0] + diff[1] / NS_PER_SEC} seconds`);
}