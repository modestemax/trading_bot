const {feed} = market = require('./market');


const start = async () => {
    try {
        const exchangeId = process.env.EXCHANGE || 'binance';
        const timeframe = process.env.TIMEFRAME;
        // const timeframe = process.env.TIMEFRAME || '15m';
        const symbol = process.env.SYMBOL;
        // const symbol = process.env.SYMBOL||'BNB/BTC';
        const exchange = await market.init({exchangeId});

        await feed.start({exchange, timeframe, symbol})
        // await feed.start({exchange, timeframe, symbol, onCandleFetched})


    } catch (ex) {
        debugger;
        console.log('End with error', ex)
        process.exit(1);
    }
};


start();