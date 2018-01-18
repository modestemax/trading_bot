'use strict';
const Feed = require('../feed/feed');

(async function () {
    let feed = new Feed({exchange: 'binance', symbol: 'ETH/BTC'});

    await feed.start();
})();
