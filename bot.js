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
        indicators:await signal.strategies.reduce(async (indicators, strategy) => {
            indicators[strategy] = await signal[strategy]({prices})
            return indicators;
        }, {})
    })

}

const start = async () => {
    try {
        // const exchangeId = process.env.EXCHANGE || 'binance';
        const exchangeId =  'coinmarketcap';
        const timeframe = process.env.TIMEFRAME || '15m';
        const symbol = process.env.SYMBOL;
        // const symbol = process.env.SYMBOL||'BNB/BTC';
        const exchange = await market.init({exchangeId,coinmarketcap:true});

        await feed.start({exchange, timeframe, symbol})
        // await feed.start({exchange, timeframe, symbol, onCandleFetched})

        //xx();

        async function xx() {

            await  market.start({
                exchange, limit: null, timeframe, symbol: 'OST/BTC',
                onSave: async (err, {data, exchangeId, symbol, timeframe}) => {
                    if (!err) {
                        const prices = await db.loadPrices({exchangeId, symbol, timeframe});
                        let symbolStatus = await trader.getSymbolStatus({symbol, prices, exchangeId, timeframe});
                        let ema = await signal.ema({prices: prices})
                        //  debugger
                        console.log(symbol, ema, new Date(prices[prices.length - 1].timestamp))
                        await xx();
                        // if (symbolStatus && !pumpings[symbol]) {
                        //     pumpings[symbol] = symbolStatus;
                        //     await notifyCanBuy({chatId, buyPosition: symbolStatus});
                        //     let buyPrice = await trader.buy({symbol, buyPosition: symbolStatus, exchangeId});
                        //     if (buyPrice) {
                        //         await notifyBuy({chatId, buyPrice, symbol, timeframe});
                        //         let sellPoint = await trader.checkSellPoint({
                        //             buyState: symbolStatus,
                        //             exchange,
                        //             symbol,
                        //             timeframe
                        //         });
                        //         await notifyTimeToSell({chatId, buyPrice, sellPoint})
                        //         let soldPoint = await trader.sell({sellPoint, symbol, exchangeId});
                        //         await  notifySell({buyPrice, soldPoint})
                        //         pumpings[symbol].tradeCompleted = true;
                        //         await tradeCompleted({chatId, buyState: symbolStatus, soldPoint})
                        //     }
                        // } else if (!symbolStatus && pumpings[symbol] && pumpings[symbol].tradeCompleted) {
                        //     pumpings[symbol] = null;
                        // }
                    }
                }
            });
        }

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