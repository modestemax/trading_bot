const debug = require('debug')('app:cmc');
const _ = require('lodash');
const ccxt = require('ccxt');
const Knex = require('knex');
const COINMARKETCAP = 'coinmarketcap';
const DATA_TABLE_NAME = 'ticker';
const knex = Knex({
    client: 'pg',
    pool: {min: 10, max: 10},
    connection: process.env.PG_CONNECTION_STRING || 'postgresql://postgres:ameen*3n@localhost:5432/trading_bot',
    searchPath: [COINMARKETCAP, 'public'],
})
const coinMarketCap = new ccxt[COINMARKETCAP]();

async function init() {
    try {
        debug('init cmc')
        await coinMarketCap.sleep(coinMarketCap.rateLimit);
        await coinMarketCap.loadMarkets();
        await loadTickers();
    } catch (ex) {
        throw ex;
    }
}

const loadTickers = async () => {
    try {
        debug('fetch tickers');
        let tickers = await coinMarketCap.fetch_tickers();
        tickers = Object.values(tickers)
            .map(i => _.pick(i.info, ["id", "name", "symbol", "rank", "price_usd", "price_btc", "24h_volume_usd",
                "market_cap_usd", "percent_change_1h", "percent_change_24h", "percent_change_7d", "last_updated"]))
            .map(i => _.extend(i, {last_updated: new Date(i.last_updated * 1000)}));
        debug('tickers fetched, ', new Date());
        await knex.transaction(async function (trx) {
            await trx.from(DATA_TABLE_NAME).delete();
            const chunkSize = 10;
            return await trx.batchInsert(DATA_TABLE_NAME, tickers, chunkSize);
            // await trx.commit();
        })
    } catch (ex) {
        debug('cmc error ' + ex.message)
    } finally {
        debug('wait 5 min');
        setTimeout(loadTickers, 1000 * 60 * 5);
    }
};

try {
    init();
} catch (ex) {
    debug('init error ', ex.message)
}
