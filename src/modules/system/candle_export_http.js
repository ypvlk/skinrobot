const _ = require('lodash');
const moment = require('moment');
const Mathematics = require('../../utils/mathematics');

module.exports = class CandleExportHttp {
    constructor(candlestickRepository) {
        this.candlestickRepository = candlestickRepository;
    }

    async getCandles(exchange, symbol, period, start, end) {
        return this.candlestickRepository.getCandlesInWindow(exchange, symbol, period, start, end);
    }

    async getCombaineExchangePairs() {
        const symbols = [];

        const tickers = await this.candlestickRepository.getExchangePairs();
        tickers.forEach(ticker => {
            symbols.push(ticker.exchange + '.' + ticker.symbol.toLowerCase());
        });

        return symbols;
    }

    async getMultiplePairCandles(pairs, period, start, end, limit) {
        const result = await this.candlestickRepository.getMultiplePairCandles(pairs, period, start, end, limit);
        let count = 0;

        const formula = (change) => Math.floor(change * 100) / 100;
        
        return   _(result)
            .groupBy('time')
            .map(item => (
                count = item.length > count ? item.length : count,
                {
                    time: _.head(item).time,
                    data: item.map(obj => ({
                        id: obj.id,
                        symbol: obj.symbol,
                        change: formula(((+obj.close - obj.open) / obj.close) * 100)//Math.floor(((+result[0].open - result[0].close) / result[0].open) * 100 * 100) / 100
                    }))
                })
            )
            .filter(a => a.data.length > count - 1) //сотавляем обьекты где больше всего пара-дата соответствие
            .sortBy(obj => -obj.time) //вверху таблицы первыми видим последние даты
            .value()
    }

    async getCandlesSelectivelyOnTime(pairs, period, times) {
        const result = await this.candlestickRepository.getCandlesSelectivelyOnTime(pairs, period, times);

        return _(result).groupBy('symbol').value()
    }

    async calculationBetaAndCorrelation(pairs, period, days=[100, 30, 7]) {
        let candles = []; //array of objects

        for (const index of days) {
            //Достаем значения двух пар за раз по разным дням(разное количество свечей)
            const startTime = moment().subtract(index + 1, 'days');
            const endTime = moment().subtract(1, 'days');
            const limit = index * pairs.length;
            const result = await this.candlestickRepository.getMultiplePairCandles(pairs, period, startTime, endTime, limit);
            
            if (result.length) {
                const value = _(result).groupBy('symbol').value();
                candles.push(value);
            }
        }

        let changes = []; //array of arrays

        candles.forEach(candle => {
            //Высчитываем с получивших свечей проценты изминений от от клоуза к клоузу
            let changesArrayOfArrays = [];
            Object.keys(candle).forEach((symbol) => {
                changesArrayOfArrays.push(Mathematics.changesFromClose(candle[symbol]));
            });
            changes.push(changesArrayOfArrays);
        });

        const betas100daysLong = [];
        const betas100daysShort = [];
        const betas30daysLong = [];
        const betas30daysShort = [];
        const betas7days = [];

        const betas = [];

        changes.forEach(item => {
            betas.push(Mathematics.beta(item));
        });
        
        const betasMedian = [];

        console.log('1', Mathematics.medianFromArray());


        // //Разбиваем для времен 100 и 30 дней для лонг и шорт дней
        // const a = [];
        // const b = [];
        // const c = [];
        // const d = [];
        // for (let i = 0; i < firstChangesArrayOfArrays[0].length; i++) {
        //     const straight = firstChangesArrayOfArrays[0];
        //     const inverse = firstChangesArrayOfArrays[1];
            
        //     if (straight[i] > 0) {
        //         a.push(straight[i]);
        //         b.push(inverse[i]);
        //     }
        // }

        // betas100daysLong.push(a);
        // betas100daysLong.push(b);


        

        


        
        return
    }
};