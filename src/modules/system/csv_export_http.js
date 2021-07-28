const _ = require('lodash');
const moment = require('moment');
const CsvParser = require("json2csv").Parser;

module.exports = class CsvExportHttp {
    constructor(
        candlestickRepository,
        meanReversionRepository,
        signalRepository
    ) {
        this.candlestickRepository = candlestickRepository;
        this.meanReversionRepository = meanReversionRepository;
        this.signalRepository = signalRepository;
    }

    async downloadOnePairCandles(exchange, symbol, period, start, end, limit) {
        const result = await this.candlestickRepository.getCandlesInWindow(exchange, symbol, period, start, end, limit);
        
        if (!result.length) return [];
        
        const csvFields = ['Time', 'Open', 'High', 'Low', 'close', 'Volume'];
        const csvParser = new CsvParser({ csvFields });
        return csvParser.parse(result);
    }

    async downloadMeanReversionTable(leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit) {
        const result = await this.meanReversionRepository.getData(leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit);
        
        if (!result.length) return [];
        
        const csvFields = [
            'id', 'lead_exchange', 'lead_symbol', 'lead_change', 'lead_price', 'lead_side', 'lead_tier', 'lead_amount', 'driven_exchange', 'driven_symbol', 'driven_change', 'driven_price', 'adj_driven_change', 'driven_side', 'driven_tier', 'driven_amount', 'delta', 'signal', 'income_at'
        ];
        const csvParser = new CsvParser({ csvFields });
        return csvParser.parse(result);
    }

    async downloadSignalsTable(pair_first, pair_second, strategy, limit) {
        const result = await this.signalRepository.getSignalsByStrategy(pair_first, pair_second, strategy, limit);
        
        if (!result.length) return [];
        
        const csvFields = ['id', 'exchange', 'symbol', 'order_type', 'strategy', 'action', 'income_at'];
        const csvParser = new CsvParser({ csvFields });
        return csvParser.parse(result);
    }
};