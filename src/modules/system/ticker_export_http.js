module.exports = class TickerExportHttp {
    constructor(tickerRepository) {
        this.tickerRepository = tickerRepository;
    }

    async getTicker(exchange, symbol, days) {
        return this.tickerRepository.getTickerInWindow(exchange, symbol, days);
    }
    
    async getMultipleTickers(pairs, period, limit, time) { //TODO params не правильные параметры
        return this.tickerRepository.getMultipleTickers(pairs, period, limit, time);
    }
};