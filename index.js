const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');

const userCPUCount = os.cpus().length;
const workerPath = path.resolve('pgn-worker.js');

var blanks = [-1], pgns = [];
var games = fs.readFileSync('games.pgn').toString();
var lines = games.split('\n');
lines.forEach((_, i, line) => line[i] = line[i].replace('\r', ''));
lines.forEach((line, i) => line === '' ? blanks.push(i) : null);
blanks = blanks.filter((_, i) => i % 2 === 0).map(val => val + 1);

for (let i = 0; i < blanks.length; i++) {
    var pgn;
    if (typeof blanks[i + 1] === 'undefined') {
        pgn = lines.slice(blanks[i]).join('\n');
    } else {
        pgn = lines.slice(blanks[i], blanks[i + 1]).join('\n');
    }
    pgns.push(pgn);
}

const segmentSize = Math.ceil(pgns.length / userCPUCount);
const segments = [];

console.log(pgns.length, userCPUCount, segmentSize);

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

return Promise.all(promises).then(results => {
    var jsonGames = [];
    results.forEach(result => jsonGames.push(result));
    fs.writeFileSync('games.json', jsonGames);
});