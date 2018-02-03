const {indicators} = require('./signal')

const ADX_OK = 25;
const ADX_PERIOD = 14;

async function calculate({period, high_prices, low_prices, close_prices}) {
    const adx = await indicators.adx({period, high_prices, low_prices, close_prices});
    return {
        prior: adx[adx.length - 2],
        current: adx[adx.length - 1],
        full: adx
    }
}

async function signal({prices}) {
    let {high_prices, low_prices, close_prices} = prices.reduce(({high_prices, low_prices, close_prices}, price) => {
        high_prices.push(price.high_price);
        low_prices.push(price.low_price);
        close_prices.push(price.close_price);
        return {high_prices, low_prices, close_prices};
    }, {high_prices: [], low_prices: [], close_prices: []});

    const adx = await   calculate({period: ADX_PERIOD, high_prices, low_prices, close_prices})
    if (adx.current > ADX_OK && Signal.isTrendingUp(adx.full)) {
        return {trade: 1};
    } else {
        return {trade: 0};
    }

}

module.exports = signal;