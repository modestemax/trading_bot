const debug = require('debug')('Feed');

const Promise = require('bluebird');
const _ = require('lodash');
const ccxt = require('ccxt');
const async = require('async');
const db = require('../database/db');
const ONE_SECOND = 1000 * 1;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const feed = async ({exchange, timeframe, symbol, since, limit} = {}) =>
    (await  exchange.fetchOHLCV(symbol, timeframe, since, limit))
        .map(d => ({
            exchange: exchange.id,
            symbol, timeframe,
            timestamp: d[0],
            open_price: d[1],
            high_price: d[2],
            low_price: d[3],
            close_price: d[4],
            volume: d[5],
        }));

const feedQueue = async.queue(async function ({exchange, timeframe, symbol, since, limit = 500, continuousFeed, onSave}) {
    debug(`feeding ${exchange.id}->${symbol}->${timeframe}${since ? ' since ' + new Date(since) : ''}`)
    const verifiedSince = verifySince({timeframe, since, limit});
    let data = await  feed({exchange, timeframe, symbol, since: verifiedSince, limit});

    debug(`Ok ${data.length} klines fed  ${exchange.id}->${symbol}->${timeframe}  since  ${new Date(verifiedSince)}`)

    let lastTime = data[data.length - 1].timestamp;
    if (new Date() - lastTime > getFrame(timeframe) + ONE_SECOND * 50) {
        debugger;
        debug('bad data');
        db.del({exchange: exchange.id, symbol, timeframe});
        data = await  feed({exchange, timeframe, symbol, limit});
    }
    await Promise.all([
        db.save({data, exchangeId: exchange.id, symbol, timeframe, onSave}),
        db.del({exchangeId: exchange.id, symbol, timeframe, timestamp: oldestSince({timeframe})}),
        sleep(exchange.rateLimit)
    ]);

    continuousFeed && setTimeout(() =>
        feedQueue.push({exchange, timeframe, symbol, since: lastTime}), getNextTime({timeframe, since: lastTime})
    );
    return data;
});


async function init({exchangeId}) {
    let exchange;
    if (exchangeId in ccxt) {
        exchange = new ccxt[exchangeId]();
        if (!exchange.hasFetchOHLCV)
            throw  `${exchangeId } does not have OHLCV data`
    } else
        throw   `Exchange not found  ${exchangeId}`;
    debug('loading market for ' + exchangeId);
    await exchange.loadMarkets();
    debug('market loaded for ' + exchangeId);
    return exchange;
}

async function feedAll({feedOptions, immediate}) {
    const priority = immediate ? 'unshift' : 'push';

    return Promise.map(_.compact(_.flattenDeep([feedOptions])), (feedOptions) => {
        return new Promise((resolve, reject) =>
            feedQueue[priority](feedOptions, (err, res) => {
                // err && reject(err);
                // !err && resolve(res)
                err && debug(err)
                err || resolve(res)
            }))
    }, {concurrency: 1});
}

async function start({exchange, limit, timeframe, symbol, continuousFeed = true, onSave}) {
    //await db.clearAll()
    debug('Starting Feeding : ' + exchange.id)

    const lastTimestamp = await  db.getLastTimestamp({exchangeId: exchange.id, timeframe});

    const symbolFeedOptions = Object.keys(exchange.markets).map(marketSymbol => {
        if (symbol && marketSymbol !== symbol) return;

        return Object.keys(exchange.timeframes).map(exchangeTimeframe => {
            if (timeframe && exchangeTimeframe !== timeframe) return;
            const latest = lastTimestamp.filter(d => d.exchange === exchange.id && d.symbol === marketSymbol && d.timeframe === exchangeTimeframe)[0];
            const since = latest && latest.timestamp;
            return {
                exchange,
                timeframe: exchangeTimeframe,
                symbol: marketSymbol,
                since,
                limit,
                continuousFeed,
                onSave
            }
        });
    });
    return await feedAll({feedOptions: symbolFeedOptions});

}


function getFrame(timeframe) {
    let frame;
    if (/m$/.test(timeframe)) {
        frame = 1000 * 60 * parseInt(timeframe)
    } else if (/h$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * parseInt(timeframe)
    } else if (/d$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 24 * parseInt(timeframe)
    } else if (/w$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 60 * 24 * 7 * parseInt(timeframe)
    } else if (/M$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 60 * 24 * 7 * 31 * parseInt(timeframe)
    }

    return frame;
}

function getNextTime({timeframe, since}) {
    let epsi = 1000;
    let frame = getFrame(timeframe);
    return ((since + frame) - (new Date())) + epsi
}

function verifySince({timeframe, since, limit = 500}) {
    let vSince = oldestSince({timeframe, limit});
    return Math.max(since, vSince);
}

function oldestSince({timeframe, limit = 500}) {
    return new Date() - getFrame(timeframe) * (limit || 500);

}


const compatibleExchange = () => {
    return ccxt.exchanges.map(ex => {
        let x = new ccxt[ex]();
        return {exchange: ex, fetchOHLCV: x.has.fetchOHLCV}
    }).filter(ex => ex.fetchOHLCV).map(ex => ex.exchange).join(', ')
}


async function getLastCandle({exchange, symbol, timeframe, since}) {
    return _.flattenDeep(await feedAll({
        feedOptions: {
            exchange,
            timeframe,
            symbol,
            since,
            limit: 1,
        },
        immediate: true
    }))
}


module.exports = {start, init, compatibleExchange, sleep, getNextTime, getLastCandle}