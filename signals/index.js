const signals = {
    ema: require('./ema'),
    adx: require('./adx'),
};

const allIndicators = {}

module.exports = Object.assign({}, signals, {
    strategies: Object.keys(signals),
    setIndicators({exchangeId, symbol, timeframe, indicators}) {
        allIndicators[symbol] = allIndicators[symbol] || {}
        allIndicators[symbol][timeframe] = indicators
        debugger;
    }
});