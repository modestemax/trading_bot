const ccxt = require('ccxt');
const taLib = require('talib-promise');
const SMA = require('technicalindicators').SMA;
const EMA = require('technicalindicators').EMA;


console.log(ccxt.exchanges);// print all available exchanges
// let exchange = new ccxt.yobit ();
// let exchange = new ccxt.binance();
let exchange = new ccxt.bittrex();

// JavaScript
(async () => {
    let markets = await exchange.load_markets()
    console.log(exchange.id, markets)
    console.log(exchange)
})();


// (async () => {
//     let pairs = await exchange.publicGetSymbolsDetails ()
//     let marketIds = Object.keys (pairs['result'])
//     let marketId = marketIds[0]
//     let ticker = await exchange.publicGetTicker ({ pair: marketId })
//     console.log (exchange.id, marketId, ticker)
// }) ()

let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
if (exchange.hasFetchOHLCV) {
    (async () => {
        let markets = await exchange.load_markets()
        let btc_usd = await (exchange.fetchTicker('BTC/USDT')) // ticker for BTC/USD
        for (let symbol in exchange.markets) {

            if (symbol !== 'ETH/BTC') continue;
            let eth_btc = await (exchange.fetchTicker('ETH/BTC'))
            await sleep(exchange.rateLimit) // milliseconds
            let recentData = await exchange.fetchOHLCV(symbol, '5m') // one minute
            const CLOSE_PRICE = 4;
            close = recentData.map(t => t[CLOSE_PRICE]);
            let start = close[0];
            let end = close[close.length - 1]
            if (start < end) {
                let min = close.reduce((max, c) => Math.min(max, c), Infinity)
                let max = close.reduce((max, c) => Math.max(max, c), -Infinity)
                let gain = (end - start) / start * 100;
                let maxGain = (end - min) / start * 100;
                console.log([start, end, min, max, eth_btc.last, eth_btc.low, eth_btc.high].map(p => p * btc_usd.last))
            }


            1;
        }
    });

    (async () => {
        let markets = await exchange.load_markets()
        let btc_usd = await (exchange.fetchTicker('BTC/USDT')) // ticker for BTC/USD

        const symbol = 'ETH/BTC';
        let eth_btc = await (exchange.fetchTicker('ETH/BTC'))
        await sleep(exchange.rateLimit) // milliseconds
        let recentData = await exchange.fetchOHLCV(symbol, '5m') // one minute


        const CLOSE_PRICE = 4;

        let close = recentData.map(t => t[CLOSE_PRICE]);
        const ema9 = await taLib.execute({
            name: "SMA",
            startIdx: 0,
            endIdx: close.length - 1,
            inReal: close,
            optInTimePeriod: 10
        });

        const sma10=SMA.calculate({period:10,values:close})
        const ema10=EMA.calculate({period:10,values:close})

        let start = close[0];
        let end = close[close.length - 1]
        if (start < end) {
            let min = close.reduce((max, c) => Math.min(max, c), Infinity)
            let max = close.reduce((max, c) => Math.max(max, c), -Infinity)
            let gain = (end - start) / start * 100;
            let maxGain = (end - min) / start * 100;
            console.log([start, end, min, max, eth_btc.last, eth_btc.low, eth_btc.high].map(p => p * btc_usd.last))
        }


        1;

    })()
}

