import WsExchancheBase from './ws_exchange_base'


export default class BinanceWebsockect extends WsExchancheBase {

    constructor(options) {
        let endPoint = 'wss://stream.binance.com:9443/ws/!ticker@arr';
        super({endPoint})
    }

    onJSONMessage(data) {
        let tickers = data.map(ticker => ({
            timestamp: ticker.E,
            pair: ticker.s,
            PriceChange: ticker.p,
            priceChangePercent: ticker.P,
            PreviousDayClosePrice: ticker.x,
            currentDayClosePrice: ticker.c,
            bestBidPrice: ticker.b,
            bestBidQuantity: ticker.B,
            bestAskPrice: ticker.a,
            bestAskQuantity: ticker.A,
            openPrice: ticker.o,
            highPrice: ticker.h,
            lowPrice: ticker.l
        }));
        console.log(tickers[0])
    }

}

new BinanceWebsockect().connect();