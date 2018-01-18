const debug = require('debug')('Feed');

const ccxt = require('ccxt');
const async = require('async');
const db = require('../database/db');

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

const queue = async.queue(async function ({exchange, timeframe, symbol, since, limit}) {
    debug(`feeding ${exchange.id}->${symbol}->${timeframe}${since ? ' since ' + new Date(since) : ''}`)

    const data = await  feed({exchange, timeframe, symbol, since: since + 1, limit});

    debug(`Ok ${data.length} klines fed  ${exchange.id}->${symbol}->${timeframe}${since ? ' since ' + new Date(since) : ''}`)

    since = data[data.length - 1].timestamp;
    db.save({data, exchange: exchange.id, symbol, timeframe})
    await sleep(exchange.rateLimit);

    setTimeout(() => queue.push({exchange, timeframe, symbol, since}), getNextTime({timeframe, since}))
});


async function init({exchange_id}) {
    let exchange;
    if (exchange_id in ccxt) {
        exchange = new ccxt[exchange_id]();
        if (!exchange.hasFetchOHLCV)
            throw  `${exchange_id } does not have OHLCV data`
    } else
        throw   `Exchange not found  ${exchange_id}`;
    debug('Feed initialized for ' + exchange_id);
    await exchange.loadMarkets();
    return exchange;
}

async function start({exchange, limit}) {
    //await db.clearAll()
    debug('Starting Feeding : ' + exchange.id)

    const lastTimestamp = await  db.getLastTimestamp({exchange: exchange.id});
    Object.keys(exchange.markets).forEach((symbol) => {
        Object.keys(exchange.timeframes).forEach(async (timeframe) => {

            const latest = lastTimestamp.filter(d => d.exchange === exchange.id && d.symbol === symbol && d.timeframe === timeframe)[0];
            const since = latest && latest.timestamp;

            queue.push({exchange, timeframe, symbol, since, limit});
        })
    })
}


function getNextTime({timeframe, since}) {
    let frame, epsi = 1000;
    switch (timeframe) {
        case '1m':
        case '3m':
        case '15m':
        case '30m':
            frame = 1000 * 60 * parseInt(timeframe)
            break;
        case '1h':
        case '2h':
        case '4h':
        case '6h':
        case '8h':
        case '12h':
            frame = 1000 * 60 * 60 * parseInt(timeframe)
            break;
        case '1d':
        case '3d':
            frame = 1000 * 60 * 60 * 24 * parseInt(timeframe)
            break;
        case '1w':
            frame = 1000 * 60 * 60 * 24 * 7 * parseInt(timeframe)
            break;
        case '1M':
            frame = 1000 * 60 * 60 * 24 * 31 * parseInt(timeframe)
            break;
    }
    return ((since + frame) - (new Date())) + epsi
}

module.exports = {start, init}