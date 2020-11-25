const fs = require('fs');
const {
    getJSONWithWorker,
    getJSONWithoutWorker,
    benchmark
} = require('./helpers');

var blanks = [-1], pgns = [];
var games = fs.readFileSync('games-128.pgn').toString();
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

console.log(`${blanks.length} games parsed`);
(async () => {
    await benchmark(getJSONWithWorker, pgns, "With multi-threading").then();
    await benchmark(getJSONWithoutWorker, pgns, "Without multi-threading");
})();