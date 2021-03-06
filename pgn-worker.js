const { parentPort, workerData } = require('worker_threads');
const parser = require('chess-pgn-parser');

const pgns = workerData;
const result = pgns.map(pgn => JSON.parse(parser.pgn2json(pgn)));
parentPort.postMessage(result);