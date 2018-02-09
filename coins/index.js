const debug = require('debug')('app:coins');
const _ = require('lodash');
const ccxt = require('ccxt');
const db = require('../candles_feed/database');

const exchangeId = process.env.EXCHANGE || 'bittrex';

if (!(exchangeId in ccxt)) {
    throw new Error('Invalid Exchange ', exchangeId)
}


async function updateCoins() {
    const exchange = new ccxt[exchangeId]();
    await exchange.loadMarkets();
    // let coins = Object.values(exchange.currencies);
    let tickers = await exchange.fetch_tickers();
    let coins =_.uniqBy(  Object.keys(tickers).map(symbol => {
        let coin = symbol.split('/')[0];
        return {id: coin, name: coin, symbol: coin}
    }),'id');
    await  db.deleteCoins({exchangeId: exchange.id})
    return await  db.saveCoins({coins, exchangeId: exchange.id})
}

debug('updating coins for ', exchangeId);

updateCoins().then((ok) => debug('ok ', ok), (err) => debug('error ', err));

