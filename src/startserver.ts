import * as fs from 'fs';
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as KoaBody from 'koa-body'; void KoaBody;
import * as AsyncLock from 'async-lock';
import { MarkovSession, MessageHistory }  from './sessions';
import * as conf from './config';
import { logerrx, logx } from './util';
import koaBody = require('koa-body');

const app = new Koa();
const route = new KoaRouter();
const lock = new AsyncLock();

const models = (() => {
    const res = {} as { [k: string]: boolean | undefined };
    try {
        for (let n of fs.readdirSync(conf.MODELPATH)
            .filter(e => fs.statSync(`${conf.MODELPATH}/${e}`).isDirectory())
        ) res[n] = true;
    } catch (err) { 
        if (!err.code.includes('ENOENT')) throw err;
    }
    return res;
})();

/**                                      has invalid chars       only whitespace */
const idIsInvalid = (id: string) => /[/\\?%*:|"<>]/g.test(id) || /^\s*$/.test(id);

route.get('sentence', '/sentence', async ctx => {
    const id = ctx.query['id'];
    let wc = ctx.query['wc'];
    if (id === undefined || !models[id]) {
        ctx.status = 404;
        return;
    }
    if (!(parseInt(wc) > 0))
        wc = 10;
    ctx.body = {
        status: 200,
        message: await new MarkovSession(id).generateText(wc)
    };
});

route.post('newsentence', '/sentence', koaBody(), async ctx => {
    if (ctx.request.header['content-type'] !== 'application/json') {
        ctx.status = 400;
        return;
    }
    const { id, message } = ctx.request.body;
    if (id === undefined || idIsInvalid(id) || message === undefined) {
        ctx.status = 400;
        return;
    }
    await lock.acquire(id, async () => {
        await Promise.all([
            new MessageHistory(id).addEntry(message),
            new MarkovSession(id).updateTable(message)
        ]);
        models[id] = true;
        ctx.status = 200;
    });
    logx(`added ${id}: ${message}`);
});

app.use(route.routes())
    .use(route.allowedMethods())
    .use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            logerrx(err.message);
            ctx.status = 500;
        }
    });

app.listen(conf.PORT, conf.HOST, () =>
    logx(`server listening on ${conf.HOST}:${conf.PORT}!`));
