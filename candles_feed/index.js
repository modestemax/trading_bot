const debug=require('debug')('app:candles_feed');
const {feed} = market = require('./market');
const _ = require('lodash');
const cluster = require('cluster');
const difference = require('array-difference');
const db = require('./database');

const exchangeId = process.env.EXCHANGE || 'bittrex';
// const exchangeId = process.env.EXCHANGE || 'binance';
const timeframe = process.env.TIMEFRAME;
const MAX_COIN = process.env.MAX_COIN || 5
const CHANGE_1H = process.env.CHANGE_1H || 5
// const timeframe = process.env.TIMEFRAME || '15m';
const symbol = process.env.SYMBOL;

let exchange;

let top5_symbols, top5_symbols_prev;
let worker;


function isDiff(prev_list, list) {
    let diff = difference(prev_list || [], list || []);
    return diff.length
}

const start = async () => {
    try {
        top5_symbols_prev = top5_symbols;

        // const symbol = process.env.SYMBOL||'BNB/BTC';
        exchange = exchange || await market.init({exchangeId});

        // if (!await db.coinsExists(exchangeId)) {
        //     let coins = Object.values(exchange.currencies);
        //     coins = coins.map(i => ({id: i.id, name: i.id, symbol: i.code}))
        //     await  db.saveCoins({coins, exchangeId})
        // }
        const trending_up = await db.getTrendingUp({exchangeId, change_1h: CHANGE_1H});

        const tickers = _.map(trending_up, 'symbol');
        top5_symbols = tickers.slice(0, MAX_COIN);

        if (cluster.isMaster) {
            if (isDiff(top5_symbols_prev, top5_symbols)) {
                if (worker) {
                    worker.kill(2);
                    worker = null;
                }
                if (top5_symbols.length) {
                    debug('new coin found, ',top5_symbols)
                    debug('previous coin , ',top5_symbols_prev)
                    worker = cluster.fork();
                    worker.on('exit', (code, signal) => {
                        if (signal !== 2) {
                            worker = cluster.fork();
                        }
                    });
                }else {
                    debug('No running worker')
                }
            }else {
                debug('No new coin, stick with previous ', top5_symbols_prev)
            }
            process.nextTick(() => {
                // setTimeout(start, 1000 * 60 * 5);
                setTimeout(start, 1000 * 12);
            })
        } else {
            debug('worker start with , ', top5_symbols);
            await feed.start({exchange, symbols: top5_symbols/*, timeframes*/})

        }

    } catch (ex) {
        debugger;
        console.log('End with error', ex.message)
        process.nextTick(start);
    }
};


start();