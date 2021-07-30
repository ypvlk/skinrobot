const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const { Parser, AsyncParser } = require('json2csv');

module.exports = class CsvExportHttp {
    constructor(
        candlestickRepository,
        meanReversionRepository,
        signalRepository,
        tickerRepository,
        logger,
        projectDir
    ) {
        this.candlestickRepository = candlestickRepository;
        this.meanReversionRepository = meanReversionRepository;
        this.signalRepository = signalRepository;
        this.tickerRepository = tickerRepository;
        this.logger = logger;
        this.projectDir = projectDir;
    }

    saveSyncIntoFile(data, path, fields) {
        console.log('Saving data into file...');

        const csvParser = new Parser({ fields });
        const csv = csvParser.parse(data); //[это массив обьектов]

        fs.writeFileSync(`${path}.csv`, csv, function(err) {
            if (err) this.logger.error(`Write save into file sync error: ${String(err)}`);
        });

        console.log(`File ${path}.csv saved.`);
    }

    async downloadOnePairCandles(exchange, symbol, period, start, end, limit) {
        const result = await this.candlestickRepository.getCandlesInWindow(exchange, symbol, period, start, end, limit);
        
        if (!result.length) return [];
        
        const fields = Object.keys(_.head(result)); //['Time', 'Open', 'High', 'Low', 'close', 'Volume'];
        const csvParser = new Parser({ fields });
        return csvParser.parse(result);
    }

    async downloadMeanReversionTable(leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit) {
        const result = await this.meanReversionRepository.getData(leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit);
        
        if (!result.length) return [];
        
        const fields = Object.keys(_.head(result));
        // [
        //     'id', 'lead_exchange', 'lead_symbol', 'lead_change', 'lead_price', 'lead_side', 'lead_tier', 'lead_amount', 'driven_exchange', 'driven_symbol', 'driven_change', 'driven_price', 'adj_driven_change', 'driven_side', 'driven_tier', 'driven_amount', 'delta', 'signal', 'income_at'
        // ];
        const csvParser = new Parser({ fields });
        return csvParser.parse(result);
    }

    async downloadSignalsTable(pair_first, pair_second, strategy, limit) {
        const result = await this.signalRepository.getSignalsByStrategy(pair_first, pair_second, strategy, limit);
        
        if (!result.length) return [];
        
        const fields = Object.keys(_.head(result)); //['id', 'exchange', 'symbol', 'order_type', 'strategy', 'action', 'income_at'];
        const csvParser = new Parser({ fields });
        return csvParser.parse(result);
    }

    async saveTickersTableIntoFile(pairs, period, date, path, limit) {
        //https://www.programmersought.com/article/47113674100/
        const dateNow = new Date(date) / 1;

        let startTime = moment(dateNow).utc().startOf('day').unix() * 1000; 
        let endTime = moment(dateNow).utc().endOf('day').unix() * 1000;

        const fields = ['id', 'exchange', 'symbol', 'bidPrice', 'bidSize', 'askPrice', 'askSize', 'period', 'income_at'];

        const options = { fields };
        const options2 = {fields: fields, header: false};

        let csvParser = new Parser(options);
        let csv_part = csvParser.parse([]);

        let writerStream = fs.createWriteStream(path);
        writerStream.write(csv_part,'utf8');

        let tickersFromDB;

        do {
            if (startTime > endTime) break;

            let csv = '';

            tickersFromDB = await this.tickerRepository.getMultipleTickers(pairs, period, startTime, endTime, limit);
            
            if (tickersFromDB && tickersFromDB.length > 0) {
                csvParser = new Parser(options2);
                csv_part = csvParser.parse(tickersFromDB);

                // Need to add enter
                csv += '\n';
                csv += csv_part;

                writerStream.write(csv,'utf8');

                if (tickersFromDB[tickersFromDB.length - 1].income_at > startTime) startTime = tickersFromDB[tickersFromDB.length - 1].income_at;
            }

        } while (tickersFromDB && tickersFromDB.length > limit - 1); 

        //mark the end of the file
        writerStream.end();

        // Handle stream events-> data, end, and error
        writerStream.on('finish', function() {
            console.log(`File ${path}.csv saved.`);
            return;
        });

        writerStream.on('error', (err) => {
            this.logger.error(`Write save into file stream error: ${String(err)}`);
            return;
        });
    }
};