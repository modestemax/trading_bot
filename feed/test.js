'use strict';
const {init: feed_init, start: feed_start} = require('./feed');

(async function () {
    try {
        const binance = await feed_init({exchange_id: 'binance'});
        await  feed_start({exchange: binance, limit: null})

    } catch (ex) {
        debugger
        console.log(ex)
    }

})();
