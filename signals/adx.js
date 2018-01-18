const Signal = require('./signal')
const {ADX_OK, ADX_PERIOD} = require('../test/constants')


class ADX extends Signal {
    static async calculate({period, high, low, close}) {
        const adx = await this.adx({period, high, low, close});
        return {
            prior: adx[adx.length - 2],
            current: adx[adx.length - 1],
            full: adx
        }
    }

    static async signal({high, low, close}) {

        const adx = await   ADX.calculate({period: ADX_PERIOD, high, low, close})
        if (adx.current > ADX_OK && Signal.isTrendingUp(adx.full)) {
            return ADX_OK;
        }

    }
}

module.exports = ADX;