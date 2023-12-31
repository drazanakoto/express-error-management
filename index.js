import express from 'express';
import util from 'node:util';
import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID as uuid} from 'node:crypto';

const app = express();
const sleep = util.promisify(setTimeout);


const store = new AsyncLocalStorage();

app.use(function (req, res, next) {
    req['uuid'] = uuid();
    next();
});

app.use(function (req, res, next) {
    store.run({req, res}, next);
});

app.get('/uuid', function handle(req, res) {
    res.send(uuid());
});

app.get('/same/request', function handle(req, res) {
    const ctx = store.getStore();
    res.send(ctx.req === req);
});

app.get('/syncError', function handle(req, res) {
    throw new Error('sync error');
});

app.get('/greeting/:name', function handle(req, res) {
    res.send({message: `Hello ${req.params.name}!`});
});

app.get('/asyncError', async function (req, res) {
    await sleep(100);
    throw new Error('async error');
});


app.use(handleError);
process.on('unhandledRejection', function(err, promise) {
    const {req, res} = store.getStore();
    console.log(promise, req.uuid);
    return handleError(err, req, res);
});


function handleError(err, req, res, next) {
    console.error(err);
    res.status(500).send({message: 'Noooooooooo!'});
}


app.listen(3000, function () {
    console.log('Server running on port 3000');
});