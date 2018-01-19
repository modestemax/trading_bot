'use strict';
const feed = require('./feed');

(async function () {
    try {
        const binance = await feed.init({exchange_id: 'binance'});
        await  feed.start({
            exchange: binance, limit: null, continuousFeed: false, timeframe: '1m',
            onSave: async (err, {data, exchange, symbol, timeframe}) => {
                const buyAt= await trader.checkBuy({data, exchange, symbol, okAt: '5%', stopLossAt: '-1%', trailingStopLossAt: '2%'})

            }
        })


    } catch (ex) {
        debugger
        console.log(ex)
    }

})();
