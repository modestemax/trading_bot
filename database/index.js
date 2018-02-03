const debug = require('debug')('Database');
const fs = require('fs');
const path = require('path');
const Knex = require('knex');

const DB_BASE_DIR = __dirname;
const TEMPLATE_DB = path.join(DB_BASE_DIR, 'template.sqlite');
const DATA_TABLE_NAME = 'candle';

const fn = module.exports = {

    async clearAll() {
        await knex(DATA_TABLE_NAME).del();
    },
    async getLastTimestamp({exchangeId, symbol, timeframe}) {
        const candles = await fn.loadPrices({exchangeId, symbol, timeframe, limit: 1});
        return candles[candles.length - 1];
    },
    async save({data, exchangeId, symbol, timeframe, onCandlesSaved} = {}) {
        const knex = await getKnex({exchangeId, symbol, timeframe});
        const chunkSize = 100;
        await knex.batchInsert(DATA_TABLE_NAME, data, chunkSize);
        onCandlesSaved && onCandlesSaved({data, exchangeId, symbol, timeframe});
    },

    async del({exchangeId, symbol, timeframe, timestamp} = {}) {
        const knex = await getKnex({exchangeId, symbol, timeframe});
        let delQuery = knex(DATA_TABLE_NAME)
        timestamp && delQuery.where('timestamp', '<', timestamp)
        await delQuery.delete();
        debug(`deleted ${exchangeId}->${symbol}->${new Date(timeframe)}`);
    },

    async loadPrices({exchangeId, symbol, timeframe, limit = 500} = {}) {
        const knex = await getKnex({exchangeId, symbol, timeframe});
        let data = await knex.select().from(DATA_TABLE_NAME)
            .where('symbol', symbol)
            .where('timeframe', timeframe)
            .limit(limit).orderBy('timestamp', 'desc');
        return data.reverse();
    }

};

const dbExist = {};

async function getKnex({exchangeId, symbol, timeframe}) {
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
            return Knex({
                client: 'pg',
                pool: {min: 0, max: 300},
                connection: process.env.PG_CONNECTION_STRING || 'postgresql://postgres:ameen*3n@localhost:5432/trading_bot',
                searchPath: [exchangeId, 'public'],
            })
    }
}
