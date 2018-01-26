const tme = require('./index');

const exchange = process.env.EXCHANGE;
const timeframe = process.env.TIMEFRAME;

if (exchange && timeframe) {
    tme.start({chat: {id: 'xxxx'}}, [, exchange, timeframe]);
}