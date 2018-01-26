const TelegramBot = function () {
    return {}
};// require('node-telegram-bot-api');

const trader = require('../trader');

const feed = require('../feed/feed');
const signal = require('../signals');
const db = require('../database/db');

// replace the value below with the Telegram token you receive from @BotFather
const token = '545101798:AAGM1TodXYaS0MreKKimt23KZlXTmmEH_pU';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const defaultTimeframe = '1m';

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

const start = async (msg, match) => {
    const chatId = msg.chat.id;

    try {
        const exchangeId = match[1];
        const timeframe = match[2] || defaultTimeframe;
        const exchange = await feed.init({exchangeId});
        xx();

        async function xx() {

            await  feed.start({
                exchange, limit: null, timeframe, symbol: 'OST/BTC',
                onSave: async (err, {data, exchangeId, symbol, timeframe}) => {
                    if (!err) {
                        const prices = await db.loadPrices({exchangeId, symbol, timeframe});
                        let symbolStatus = await trader.getSymbolStatus({symbol, prices, exchangeId, timeframe});
                        let ema = await signal.ema({prices:prices})
                        //  debugger
                        console.log(symbol, ema,new Date(prices[prices.length-1].timestamp))
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
    bot.sendMessage(msg.chat.id, feed.compatibleExchange())
}


module.exports = {start, compatibleExchange}
