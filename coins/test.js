const ccxt = require('ccxt');

const exchangeId = process.env.EXCHANGE || 'binance';

const coinMarketCap = new ccxt['coinmarketcap']();
const exchange = new ccxt[exchangeId]();

(async function detect() {
    await coinMarketCap.loadMarkets();
    await exchange.loadMarkets();
    const tickers = await coinMarketCap.fetch_tickers()
    const up_24h = Object.values(tickers).map(i => i.info)
        .filter(i => i.percent_change_1h >= 2 && i.percent_change_24h > 0)
    // .filter(i => i["24h_volume_usd"] >= 1e6);
    const up_7d = up_24h.filter(i => i.percent_change_7d > 0);
    let detected;
    if (up_24h.length) {
        const up = up_24h.map(c => c.symbol);
        console.log("coinMarketCap", up.join(', '))
        detected = Object.keys(exchange.markets)
            .reduce((detected, symbol) =>
                    up.includes(exchange.markets[symbol].base) ? detected.concat(symbol) : detected
                , []);

        console.log('\n', exchangeId, detected.join(', '))
    }

})();