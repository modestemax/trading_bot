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

module.exports = {getPumpingStatus}