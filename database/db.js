const debug = require('debug')('Database');
const Bluebird = require('bluebird');
const Knex = require('knex');
const async = require('async');

const CNX_STRING = '/home/max/projects/ccxt/database/mbot.sqlite';

const knex = Knex({
    client: 'sqlite3',
    // debug: true,
    connection: {
        filename: CNX_STRING
    }
});

const saveQueue = async.queue(async function ({data}) {
// const saveQueue = async.queue(async ({data}, callback) => {
//     debugger;
    const bacthCount = 100;
    const {exchange, symbol, timeframe} = data[0];
    let s_data = [].concat(data)
    debug(`saving ${exchange}->${symbol}->${timeframe}`)
    while (s_data.length) {
        await knex('recent_data').insert(s_data.splice(0, bacthCount));
    }
    debug(`saved ${exchange}->${symbol}->${timeframe}`);
});

const loadKlinesQueue = async.queue(async function ({exchange, symbol, timeframe, limit = 500}) {
// const saveQueue = async.queue(async ({data}, callback) => {
//     debugger
    let data = [];
    debug(`saving ${exchange}->${symbol}->${timeframe}`)
    for (let skip = 0, step = 100; skip < limit; skip += data.length) {
        let count = Math.min(step, limit - data.length);
        let s_data  = await knex('klines')
            .where('exchange', exchange)
            .where('symbol', symbol)
            .where('timeframe', timeframe)
            .skip(skip)
            .limit(count);

        data = data.concat(s_data)
    }
    return data

});


const clearAll = async () => {
    await knex('recent_data').del();
};
const getLastTimestamp = async ({exchange}) => {
    return knex('last_timestamp').where('exchange', exchange);
};
const save = async ({data} = {}) => {
    saveQueue.push({data}, (err, ok) => {
        err && console.log(err)
    })
};

const loadKlines = async ({exchange, symbol, timeframe, limit = 500} = {}) => {
    return new Promise((resolve, reject) => {
        loadKlinesQueue.push({exchange, symbol, timeframe, limit}, (err, data) => {
            err && reject(err);
            err || resolve(data);
        })
    })

};

module.exports = {save, getLastTimestamp,loadKlines};
