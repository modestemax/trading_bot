const fs = require('fs')
const ccxt = require('ccxt')

const exchange = new ccxt.binance();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


async function getRecentData({symbol = 'ETH/BTC', timeframe = '1m', type = 4} = {}) {
    let markets = await exchange.loadMarkets()
    await sleep(exchange.rateLimit) // milliseconds
    let recentData = await exchange.fetchOHLCV(symbol, timeframe) // one minute

    return type ? recentData.map(t => t[type]) : recentData;

}

async function saveData() {
    let data = await getRecentData()
    fs.writeFileSync('data.json', JSON.stringify(data))

}

async function loadData({serie}) {
    let data =JSON.parse( fs.readFileSync('data.json', 'utf8'))
    return data.map(d => d[serie])
}

// saveData()

module.exports = {loadData}