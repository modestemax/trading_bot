const {indicators} = require('./signal')

const EMA_SHORT_PERIOD = 5;
const EMA_LONG_PERIOD = 10;

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
    const ema_short = await  calculate({period: EMA_SHORT_PERIOD, prices: closes});
    const ema_long = await  calculate({period: EMA_LONG_PERIOD, prices: closes});

    /** have the lines crossed? */
    let down_cross = ema_short.prior <= ema_long.current && ema_short.current > ema_long.current;
    let up_cross = ema_long.prior <= ema_short.current && ema_long.current > ema_short.current;

    const up = true;
    const down = true;

    if (down_cross) {
        return {trade: 1, up};
    }
    if (up_cross) {
        return {trade: 1, down};
    }

    if (ema_short.current > ema_long.current) {
        return {trade: 0, up};
    } else {
        return {trade: 0, down};
    }
}

module.exports = signal;