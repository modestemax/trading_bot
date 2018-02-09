const debug = require('debug')('app:market');
const ccxt = require('ccxt');

module.exports = {
    feed: require('./feed'),
    async init({exchangeId, coinmarketcap}) {
        let exchange;
        if (exchangeId in ccxt) {
            exchange = new ccxt[exchangeId]();
            if (!exchange.hasFetchOHLCV && !coinmarketcap)
                throw  `${exchangeId } does not have OHLCV data`
        } else
            throw   `Exchange not found  ${exchangeId}`;

        debug('loading market for ' + exchangeId);
        await exchange.loadMarkets();
        debug('market loaded for ' + exchangeId);
        return exchange;
    },
}