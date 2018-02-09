const debug = require('debug')('Database');
const fs = require('fs');
const path = require('path');
const Knex = require('knex');
const async = require('async');

const DB_BASE_DIR = __dirname;
const TEMPLATE_DB = path.join(DB_BASE_DIR, 'template.sqlite');
const CANDLE_TABLE_NAME = 'candle';
const COIN_TABLE_NAME = 'coin';
const CMC_SCHEMA = 'coinmarketcap';
const TREND_FUNCTION_NAME = CMC_SCHEMA + '.trending_up_';

const saveQueue = async.queue(async function ({data, exchangeId, symbol, timeframe, dbAdapter, onCandlesSaved}) {
    await dbAdapter.transaction(async function (trx) {
        const chunkSize = 100;
        await trx.batchInsert(exchangeId + '.' + CANDLE_TABLE_NAME, data, chunkSize);
        onCandlesSaved && onCandlesSaved({data, exchangeId, symbol, timeframe});
    })

}, 100);

const trendingUpTickers = {};
const fn = module.exports = {

    async clearAll() {
        await dbAdapter(exchangeId + '.' + CANDLE_TABLE_NAME).del();
    },

    // async getTrendingUp({exchangeId, change_1h = 2, change_24h = null, change_7d = null, volume = null, rank = null}) {
    //     const key = [exchangeId, change_1h, change_24h, change_7d, volume, rank].join(';');
    //     if (!trendingUpTickers[key]) {
    //         const dbAdapter = await getAdapter({exchangeId: CMC_SCHEMA});
    //         trendingUpTickers[key] = await dbAdapter.query('SELECT * from ' + TREND_FUNCTION_NAME + exchangeId + '(?,?,?,?,?);',
    //             {replacements: [change_1h, change_24h, change_7d, volume, rank], type: dbAdapter.QueryTypes.SELECT});
    //         debugger;
    //         console.log()
    //         trendingUpTickers[key] = trendingUpTickers[key].rows;
    //         setTimeout(() => (trendingUpTickers [key] = null), 1000 * 60 * 5);
    //     }
    //     debug('trade ' + exchangeId);
    //     debug(trendingUpTickers[key].map(i => i.symbol));
    //     return trendingUpTickers[key];
    // },

    async getTrendingUp({exchangeId, change_1h = 2, change_24h = null, change_7d = null, volume = null, rank = null}) {
           const key = [exchangeId, change_1h, change_24h, change_7d, volume, rank].join(';');
           if (!trendingUpTickers[key]) {
               const dbAdapter = await getAdapter({exchangeId: CMC_SCHEMA});
               trendingUpTickers[key] = await dbAdapter.raw('SELECT * from ' + TREND_FUNCTION_NAME + exchangeId + '(?,?,?,?,?);', [change_1h, change_24h, change_7d, volume, rank]);
               trendingUpTickers[key] = trendingUpTickers[key].rows;
               setTimeout(() => (trendingUpTickers [key] = null), 1000 * 60 * 5);
           }
           debug('trade ' + exchangeId);
           debug(trendingUpTickers[key].map(i => i.symbol));
           return trendingUpTickers[key];
       },


    async coinsExists(exchangeId) {
        const dbAdapter = await getAdapter({exchangeId});
        const exists = await dbAdapter.raw('select count(*) from ' + exchangeId + '.' + COIN_TABLE_NAME);
        return +exists.rows[0].count
    },

    async getLastTimestamp({exchangeId, symbol, timeframe}) {
        const candles = await fn.loadPrices({exchangeId, symbol, timeframe, limit: 1});
        return candles[candles.length - 1];
    },
    async save({data, exchangeId, symbol, timeframe, onCandlesSaved} = {}) {
        const dbAdapter = await getAdapter({exchangeId, symbol, timeframe});

        saveQueue.push({data, dbAdapter, exchangeId, symbol, timeframe, onCandlesSaved})
    },
    async saveCoins({coins, exchangeId} = {}) {
        const dbAdapter = await getAdapter({exchangeId});

        return await dbAdapter.transaction(async function (trx) {
            const chunkSize = 100;
            await trx.batchInsert(exchangeId + '.' + COIN_TABLE_NAME, coins, chunkSize);
        })
    },
    async deleteCoins({exchangeId} = {}) {
        const dbAdapter = await getAdapter({exchangeId});

        await dbAdapter.transaction(async function (trx) {
            await trx.from(exchangeId + '.' + COIN_TABLE_NAME).delete();
        })
    },

    async del({exchangeId, symbol, timeframe, timestamp} = {}) {
        const dbAdapter = await getAdapter({exchangeId, symbol, timeframe});
        let delQuery = dbAdapter(exchangeId + '.' + CANDLE_TABLE_NAME)
        timestamp && delQuery.where('timestamp', '<', timestamp)
        await delQuery.delete();
        debug(`deleted ${exchangeId}->${symbol}->${new Date(timeframe)}`);
    },

    async loadPrices({exchangeId, symbol, timeframe, limit = 500} = {}) {
        const dbAdapter = await getAdapter({exchangeId, symbol, timeframe});
        return dbAdapter.transaction(async function (trx) {
            let data = await trx.select().from(exchangeId + '.' + CANDLE_TABLE_NAME)
                .where('symbol', symbol)
                .where('timeframe', timeframe)
                .limit(limit).orderBy('timestamp', 'desc');
            return data.reverse();
        })

    }

};

const dbExist = {};
const pg = {};

async function getAdapter({exchangeId, symbol, timeframe}) {
    const key = [exchangeId, symbol, timeframe].join(';')
    switch (process.env.DB_DRIVER) {
        case 'sqlite3':

            const filename = path.join(DB_BASE_DIR, `${exchangeId}${symbol.replace('/', '_')}${timeframe}.sqlite`);
            if (!dbExist[filename] && !fs.existsSync(filename)) {
                fs.copyFileSync(TEMPLATE_DB, filename)
            }
            dbExist[filename] = true;
            return Knex({
                client: 'sqlite3',
                useNullAsDefault: true,
                // debug: true,
                connection: {filename}
            });
        default:
            return pg[key] || (pg[key] = Knex({
                client: 'pg',
                pool: {min: 1, max: 100},
                connection: process.env.PG_CONNECTION_STRING || 'postgresql://postgres:ameen*3n@localhost:5432/trading_bot',
                searchPath: [exchangeId, 'public'],
            }))

            // return getSquelize(exchangeId)
    }
}

// debugger;
// const Sequelize = require('sequelize');
// let sequelize;

function getSquelize(exchangeId) {
    sequelize = sequelize || new Sequelize(process.env.PG_CONNECTION_STRING || 'postgresql://postgres:ameen*3n@localhost:5432/trading_bot');
    debugger;
    return sequelize;
}