const _ = require('lodash');
const feed = require('../candles_feed/market/feed');
// const db = require('../database/index');

const buyWhen = 5;//percent
const traillingStopLoss = 2//percent
const stopLoos = 1//percent

const getGain = (open, close) => (close - open) / open * 100;

function getPumpingStatus({prices, buyWhen, stopLoos, traillingStopLoss}) {
    const closePrices = prices.map(p => p.close_price);
    let maybeAPick = 2;
    let gain = 0, maxGain = -Infinity, lastPrice, pumping = false;
    let pumpingGain, pumpingIndex, lastPosition = closePrices.length - 2;
    let maxPrice = Math.max(closePrices[lastPosition], closePrices[lastPosition + 1]);
    let minPrice = Math.min(closePrices[lastPosition], closePrices[lastPosition + 1]);
    while (lastPosition) {
        lastPrice = closePrices[lastPosition];
        maxPrice = Math.max(lastPrice, maxPrice);
        minPrice = Math.min(lastPrice, minPrice);
        gain += getGain(lastPrice, closePrices[lastPosition + 1]);
        maxGain = Math.max(maxGain, gain);
        // maxGain += getGain(minPrice, maxPrice);
        //debugger;
        if (gain <= -1 * Math.abs(stopLoos) || maxGain - gain >= Math.abs(traillingStopLoss)) {
            maybeAPick--;
            if (!maybeAPick)
                break;
        }
        else {
            lastPosition--;
            if (!pumping) {
                pumping = gain >= buyWhen;
                if (pumping) {
                    pumpingIndex = lastPosition;
                    pumpingGain = gain;
                }
            }
        }
    }
    return pumping ? Object.assign(prices[pumpingIndex || lastPosition], {
        gain: pumpingGain || gain,
        maxGain,
        minPrice,
        maxPrice
    }) : null;
}


async function getSymbolStatus({symbol,prices, exchangeId, timeframe}) {
    // const prices = await db.loadPrices({exchangeId, symbol, timeframe});
    return await getPumpingStatus({prices, buyWhen, stopLoos, traillingStopLoss});
}

async function checkSellPoint({symbol, buyState, exchange, timeframe}) {
    const buyPrice = buyState.close_price;
    let gain = 0, maxGain = -Infinity, since = buyState.timestamp;
    const checkTillFound = async () => {
        let lastCandle = _.last(await feed.getLastCandle({exchange, symbol, timeframe, since}));
        if (lastCandle) {
            since = lastCandle.timestamp;
            gain += getGain(buyPrice, lastCandle.close_price);
            maxGain = Math.max(gain, maxGain);
            if (maxGain - gain > traillingStopLoss || gain <= -1 * Math.abs(stopLoos)) {
                return Object.assign({sellPrice: lastCandle.close_price, tradeGain: gain}, buyState)
            }
        }
        await feed.sleep(feed.getNextTime({timeframe, since}));
        return await checkTillFound();
    };
    return await   checkTillFound();
}

async function buy({symbol, buyPosition, exchangeId}) {
    return buyPosition;
}

async function sell({sellPoint, symbol, exchangeId}) {
return sellPoint;
}

module.exports = {getPumpingStatus, getSymbolStatus, checkSellPoint, buy, sell}
