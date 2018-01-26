const debug = require('debug')('Database');
const Bluebird = require('bluebird');
const Knex = require('knex');
const async = require('async');

const CNX_STRING = `/home/max/projects/trading_bot/database/${process.env.EXCHANGE}${process.env.TIMEFRAME}.sqlite`;

const knex = Knex({
    client: 'sqlite3',
    // debug: true,
    connection: {
        filename: CNX_STRING
    }
});

const saveQueue = async.queue(async function ({data, exchangeId, symbol, timeframe}) {
// const saveQueue = async.queue(async ({data}, callback) => {
//     debugger;
    const bacthCount = 100;
    let s_data = [].concat(data)
    debug(`saving ${exchangeId}->${symbol}->${timeframe}`)
    while (s_data.length) {
        await knex('recent_data').insert(s_data.splice(0, bacthCount));
    }
    debug(`saved ${exchangeId}->${symbol}->${timeframe}`);
});

const deleteQueue = async.queue(async function ({exchangeId, symbol, timeframe, timestamp}) {
// const saveQueue = async.queue(async ({data}, callback) => {
//     debugger;
    let delQuery = knex('recent_data')
        .where('exchange', exchangeId)
        .where('symbol', symbol)
        .where('timeframe', timeframe);
    timestamp && delQuery.where('timestamp', '<', timestamp)
    await delQuery.delete();
    debug(`deleted ${exchangeId}->${symbol}->${timeframe}`);
});

const loadPricesQueue = async.queue(async function ({exchangeId, symbol, timeframe, limit = 500}) {
// const saveQueue = async.queue(async ({data}, callback) => {
//     debugger
    let data = [];
    debug(`saving ${exchangeId}->${symbol}->${timeframe}`)
    for (let skip = 0, step = 100; skip < limit; skip = data.length) {
        let count = Math.min(step, limit - data.length);
        let s_data = await knex('prices')
            .where('exchange', exchangeId)
            .where('symbol', symbol)
            .where('timeframe', timeframe)
            .offset(skip)
            .limit(count);
        if (s_data.length === 0) break;
        data = data.concat(s_data)
    }
    return data

});


const clearAll = async () => {
    await knex('recent_data').del();
};
const getLastTimestamp = async ({exchangeId, timeframe}) => {
    let query = knex('last_timestamp').where('exchange', exchangeId);
    timeframe && (query = query.where('timeframe', timeframe));
    return query;
};
const save = async ({data, exchangeId, symbol, timeframe, onSave} = {}) => {
    return new Promise((resolve, reject) => {
        saveQueue.push({data, exchangeId, symbol, timeframe}, (err) => {
            resolve();
            onSave && onSave(err, {data, exchangeId, symbol, timeframe})

        })
    })

};

const del = async ({exchangeId, symbol, timeframe, timestamp} = {}) => {
    return new Promise((resolve, reject) => {
        deleteQueue.push({exchangeId, symbol, timeframe, timestamp}, (err) => {
            resolve();
        })
    })

};

const loadPrices = async ({exchangeId, symbol, timeframe, limit = 500} = {}) => {
    return new Promise((resolve, reject) => {
        loadPricesQueue.push({exchangeId, symbol, timeframe, limit}, (err, data) => {
            err && reject(err);
            err || resolve(data);
        })
    })

};

module.exports = {save, del, getLastTimestamp, loadPrices};
