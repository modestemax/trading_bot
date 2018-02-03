const debug = require('debug')('app:Feed');

const Promise = require('bluebird');
const _ = require('lodash');

const db = require('../database');
const {sleep} = require('../utils');
const ONE_SECOND = 1000;


const feed = async ({exchange, timeframe, symbol, since, limit} = {}) =>
    (await  exchange.fetchOHLCV(symbol, timeframe, since, limit))
        .map(d => ({
            exchange: exchange.id,
            symbol, timeframe,
            timestamp: d[0],
            open_price: d[1],
            high_price: d[2],
            low_price: d[3],
            close_price: d[4],
            volume: d[5],
        }));


function getFrame(timeframe) {
    let frame;
    if (/m$/.test(timeframe)) {
        frame = 1000 * 60 * parseInt(timeframe)
    } else if (/h$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * parseInt(timeframe)
    } else if (/d$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 24 * parseInt(timeframe)
    } else if (/w$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 60 * 24 * 7 * parseInt(timeframe)
    } else if (/M$/.test(timeframe)) {
        frame = 1000 * 60 * 60 * 60 * 24 * 7 * 31 * parseInt(timeframe)
    }

    return frame;
}

function getNextTime({timeframe, since = new Date()}) {
    let epsi = 0;
    let frame = getFrame(timeframe);
    since = since - since % frame;
    let timeout = ((since + frame) - (new Date())) + epsi
    return timeout > 0 ? timeout : 0;
}

function verifySince({timeframe, since, limit = 500}) {
    let vSince = oldestSince({timeframe, limit});
    return Math.max(since, vSince);
}

function oldestSince({timeframe, limit = 500}) {
    return new Date() - getFrame(timeframe) * (limit || 500);

}


const fn = module.exports = {
    getMarketWithOHLCV() {
        return ccxt.exchanges.map(ex => {
            let x = new ccxt[ex]();
            return {exchange: ex, fetchOHLCV: x.has.fetchOHLCV}
        }).filter(ex => ex.fetchOHLCV).map(ex => ex.exchange).join(', ')
    },


    async start({exchange, timeframe, symbol, continuousFeed = true, onCandleFetched}) {
        //await db.clearAll()
        debug('Starting Feed: ' + exchange.id)


        const feedOptions = Object.keys(exchange.markets).map(marketSymbol => {
            if (symbol && marketSymbol !== symbol) return;

            return Object.keys(exchange.timeframes).map(exchangeTimeframe => {
                if (timeframe && exchangeTimeframe !== timeframe) return;
                return {
                    // exchange,
                    timeframe: exchangeTimeframe,
                    symbol: marketSymbol,
                    // since,
                    // limit,
                    // continuousFeed,
                    onCandleFetched
                }
            });
        });
        return await fn.feedAllSymbolsCandles({exchange, feedOptions, continuousFeed, onCandleFetched});

    },

    async feedAllSymbolsCandles({feedOptions, exchange, continuousFeed, onCandleFetched, limit = 500}) {

        let allFeedOptions = _.compact(_.flattenDeep([feedOptions]));
        let lastTime;
        return allFeedOptions.reduce(async (promise, feedOption) => {
            let error;
            try {
                await promise;
                debug('feeding ' + feedOption.symbol)
                let candles = await fn.feedSymbolCandles({feedOption, exchange, onCandleFetched, limit});

                debug('feed ' + feedOption.symbol + ' ' + candles.length + ' returned')
                if (candles && candles.length) {
                    // res.push(candles);
                    lastTime = candles[candles.length - 1].timestamp;
                }
                return candles;
            } catch (ex) {
                console.log(ex);
                error = true;
            } finally {
                let timeout = error ? 0 : getNextTime({timeframe: feedOption.timeframe, since: lastTime})
                debug('set timeout for ' + feedOption.symbol + ' at ' + new Date(new Date().getTime() + timeout))
                continuousFeed && setTimeout(() => fn.feedAllSymbolsCandles({
                    exchange,
                    feedOptions: [feedOption], continuousFeed,
                    onCandleFetched
                }), timeout);
            }
        }, Promise.resolve([]));
    },

    async feedSymbolCandles({feedOption, exchange, limit = 500, onCandleFetched}) {
        const {symbol, timeframe} = feedOption;
        const exchangeId = exchange.id;
        const lastCandle = await     db.getLastTimestamp({exchangeId, symbol, timeframe});
        const since = +(lastCandle && lastCandle.timestamp) + 1;
        feedOption.since = since;


        debug(`feeding ${exchangeId}->${ symbol}->${ timeframe}${since ? ' since ' + new Date(since) : ''}`)
        const verifiedSince = verifySince({timeframe, since, limit});
        let data = await feed({exchange, timeframe, symbol, since: verifiedSince, limit});

        debug(`Ok ${data.length} candles fed  ${exchange.id}->${symbol}->${timeframe}  since  ${new Date(verifiedSince)}`);

        let lastTime = data.length && data[data.length - 1].timestamp;
        if (lastTime && new Date() - lastTime > getFrame(timeframe)) {
            debugger;
            debug('bad data');
            await db.del({exchangeId, symbol, timeframe});
            data = await feed({exchange, timeframe, symbol, limit});
        }
        debug('savind new candles for ' + symbol)
        await  Promise.all([
            db.save({data, exchangeId: exchange.id, symbol, timeframe, onCandlesSaved: onCandleFetched}),
            db.del({exchangeId: exchange.id, symbol, timeframe, timestamp: oldestSince({timeframe})}),
            sleep(exchange.rateLimit)
        ]);
        debug('saved new candles for ' + symbol)
        return data;
    },


    async getLastCandle({exchange, symbol, timeframe, since}) {
        return _.flattenDeep(await fn.feedSymbolCandles({
            exchange,
            feedOptions: {
                exchange,
                timeframe,
                symbol,
                since,
                limit: 1,
            }
        }));
    }
}