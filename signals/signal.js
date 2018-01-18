const Promise = require('bluebird')
const trend = require('trend')
const talib = Promise.promisifyAll(require('talib'))


async function adx({period, close, low, high}) {
    const ret = await talib.executeAsync({
        name: "ADX",
        startIdx: 0,
        endIdx: close.length - 1,
        high, low, close,
        optInTimePeriod: period
    });

    return ret.result.outReal
}
async function rsi({period, close, low, high}) {
    const ret = await talib.executeAsync({
        name: "RSI",
        startIdx: 0,
        endIdx: close.length - 1,
        high, low, close,
        optInTimePeriod: period
    });

    return ret.result.outReal
}

async function ema({period, prices}) {
    const ret = await talib.executeAsync({
        name: "EMA",
        startIdx: 0,
        endIdx: prices.length - 1,
        inReal: prices,
        optInTimePeriod: period
    });

    return ret.result.outReal
}

async function sma({period, prices}) {
    const ret = await talib.executeAsync({
        name: "SMA",
        startIdx: 0,
        endIdx: prices.length - 1,
        inReal: prices,
        optInTimePeriod: period
    });

    return ret.result.outReal
}


async function isTrendingUp({prices}) {
    return trend(prices) > 1;
}


module.exports = {indicators:{adx,rsi,ema,sma},tools:{isTrendingUp}};