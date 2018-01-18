const {indicators} = require('./signal')
const adx = require('./adx')
const {ADX_OK, BUY, SELL, EMA_SHORT_PERIOD, EMA_LONG_PERIOD} = require('../test/constants')


async function calculate({period, prices}) {
    const ema = await indicators.ema({prices, period});
    return {
        prior: ema[ema.length - 2],
        current: ema[ema.length - 1],
        full: ema,
    }
}

async function signal({prices}) {
    const closes = prices.map(p => p.close_price);
    const ema_short = await   calculate({period: EMA_SHORT_PERIOD, prices: closes});
    const ema_long = await   calculate({period: EMA_LONG_PERIOD, prices: closes});

    /** have the lines crossed? */
    let down_cross = ema_short.prior <= ema_long.current && ema_short.current > ema_long.current ;
    let up_cross = (ema_long.prior <= ema_short.current && ema_long.current > ema_short.current ;


    if (down_cross) {
        return BUY;
    }
    if (up_cross) {
        return SELL
    }
}

module.exports = EMA;