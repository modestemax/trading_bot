const trader = require('./trader');

const {feed} = market = require('./candles_feed/market');
const signal = require('./signals');
// const db = require('./database/index');

let pumpings = {};

function notifyCanBuy({chatId, buyPosition}) {
    console.log(`\nBuy ${buyPosition.symbol} at ${buyPosition.close_price} time ${new Date(buyPosition.timestamp)}`);
}

function notifyBuy(param) {

}

function notifyTimeToSell({chatId, buyPrice, sellPoint}) {
    console.log(`\nSell ${buyPrice.symbol} at ${sellPoint.sellPrice} win ${sellPoint.tradeGain}`);
}

function notifySell(param) {

}

function tradeCompleted({chatId, buyState, soldPoint}) {
    console.log(`\nTrade complete ${buyState.symbol} buy at ${buyState.close_price} sell at ${soldPoint.close_price}`);
}


function notifyBug(ex) {

}


async function onCandleFetched({data, exchangeId, symbol, timeframe}) {
    const prices = await db.loadPrices({exchangeId, symbol, timeframe});
    // let symbolStatus = await trader.getSymbolStatus({symbol, prices, exchangeId, timeframe});
    signal.setIndicators({
        exchangeId, symbol, timeframe,
        indicators: await signal.strategies.reduce(async (indicators, strategy) => {
            indicators[strategy] = await signal[strategy]({prices})
            return indicators;
        }, {})
    })

}

const start = async () => {
    try {
        // const exchangeId = process.env.EXCHANGE || 'binance';
        const exchangeId = 'coinmarketcap';
        const timeframe = process.env.TIMEFRAME || '15m';
        const symbol = process.env.SYMBOL;
        // const symbol = process.env.SYMBOL||'BNB/BTC';
        const exchange = await market.init({exchangeId, coinmarketcap: true});

        const tickers = await exchange.fetch_tickers()
        const up_24h=Object.values(tickers).map(i => i.info)
            .filter(i => i.percent_change_1h > 0 && i.percent_change_24h > 0)
            .filter(i => i["24h_volume_usd"] > 1e6);
        const up_7d=up_24h        .filter( i=>i.percent_change_7d > 0)


        console.log(up_24h)
        console.log('__________________')
        console.log(up_7d)

        console.log(Object.values(tickers).map(i => i.info)
            .filter(i => i.percent_change_1h > 0 && i.percent_change_24h > 0 && i.percent_change_7d > 0)
            .filter(i => i["24h_volume_usd"] > 1e6)
        )
    } catch (ex) {
        debugger;
        // bot.sendMessage(chatId, ex.toString())
        notifyBug(ex)
        console.log('End with error', ex)
        process.exit(1);
    }
};

function displayPumping({chatId, pumpings}) {
    debugger
}

const compatibleExchange = (msg) => {
    bot.sendMessage(msg.chat.id, market.compatibleExchange())
}


module.exports = {start, compatibleExchange}

start();