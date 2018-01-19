const TelegramBot = require('node-telegram-bot-api');

const trader = require('../trader');
const db = require('../database/db');
const feed = require('../feed/feed');

// replace the value below with the Telegram token you receive from @BotFather
const token = '545101798:AAGM1TodXYaS0MreKKimt23KZlXTmmEH_pU';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

const timeframe = '1m';
const buyWhen = 5;//percent
const traillingStopLoss = 2//percent
const stopLoos = 1//percent


const check = async (msg, match) => {
    const chatId = msg.chat.id;

    // let pumpings = [];
    try {
        const exchangeId = match[1];
        const exchange = await feed.init({exchangeId});
        await  feed.start({
            exchange, limit: null,  timeframe,
            onSave: (err, {data, exchange, symbol, timeframe}) => {
                if (err) throw err;
                onFeedSuccess({chatId, symbol, exchangeId,  timeframe});
            }
        });
        // pumpings = pumpings.sort((p1, p2) => p1.gain < p2.gain);
        //
        // displayPumping({
        //     chatId, pumpings: pumpings.slice(0, symbolCount)
        // })
    } catch (ex) {
        debugger;
        bot.sendMessage(chatId, ex.toString());
    }
};

async function onFeedSuccess({chatId, symbol, exchangeId,  timeframe}) {
    const prices = await db.loadPrices({exchangeId, symbol, timeframe});
    const pumpingSymbol = await trader.getPumpingStatus({prices, buyWhen, stopLoos, traillingStopLoss});

    pumpingSymbol && pumpings.push(pumpingSymbol);

}

function displayPumping({chatId, pumpings}) {
    debugger
}

module.exports = {check}