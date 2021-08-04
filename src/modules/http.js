const compression = require('compression');
const express = require('express');
const auth = require('basic-auth');
const twig = require('twig');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const os = require('os');
const fs = require('fs');

module.exports = class Http {
    constructor(
        systemUtil,
        logsHttp,
        candleExportHttp,
        tickerExportHttp,
        csvExportHttp,
        instances,
        projectDir
    ) {
        this.systemUtil = systemUtil;
        this.logsHttp = logsHttp;
        this.candleExportHttp = candleExportHttp;
        this.tickerExportHttp = tickerExportHttp;
        this.csvExportHttp = csvExportHttp;
        this.instances = instances;
        this.projectDir = projectDir;
    }

    start() {
        const assetVersion = crypto
            .createHash('md5')
            .update(String(Math.floor(Date.now() / 1000)))
            .digest('hex')
            .substring(0, 8);

        twig.extendFunction('asset_version', function() {
            return assetVersion;
        });

        twig.extendFunction('node_version', function() {
            return process.version;
        });

        twig.extendFunction('memory_usage', function() {
            return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
        });

        const up = new Date();
        twig.extendFunction('uptime', function() {
            return moment(up).toNow(true);
        });

        twig.extendFilter('format_json', function(value) {
            return JSON.stringify(value, null, '\t');
        });
        
        const app = express();

        app.set('views', `${this.projectDir}/templates`);
        app.set('twig options', {
            allow_async: true,
            strict_variables: false
        });

        app.use(express.urlencoded({ limit: '12mb', extended: true, parameterLimit: 50000 }));
        app.use(cookieParser());
        app.use(compression());
        app.use(express.static(`${this.projectDir}/web/static`, { maxAge: 3600000 * 24 }));

        const username = this.systemUtil.getConfig('webserver.username');
        const password = this.systemUtil.getConfig('webserver.password');
        
        if (username && password) {
            app.use((request, response, next) => {
                const user = auth(request);
                
                if (!user || !(user.name === username && user.pass === password)) {
                    response.set('WWW-Authenticate', 'Basic realm="Please Login"');
                    return response.status(401).send();
                }

                return next();
            });
        }

        // app.get('/', async (req, res) => {
        //     res.json({ success: true, message: '(>___<)' })
        // });
        app.get('/', async (req, res) => {
            res.render(
                '../templates/base.html.twig',
                {message: 'Hello'}
                // await ta.getTaForPeriods(this.systemUtil.getConfig('dashboard.periods', ['15m', '1h']))
            );
        });

        //query: ?exclude_levels=["debug"]
        app.get('/logs', async (req, res) => {
            res.render(
                '../templates/logs.html.twig', 
                await this.logsHttp.getLogsPageVariables(req, res)
            );
        });

        app.get('/logs/download', async (req, res) => {
            //localhost:3000/logs/download?type=general //type=pm2error
            //http://206.189.96.37:3000/logs/download?type=general
            const {
                type,
            } = req.query;

            let file = '';
            let filename = '';

            const types = {
                general: 'general',
                pm2error: 'pm2error',
                pm2out: 'pm2out'
            }

            const today = new Date().toISOString().slice(0, 10)

            if (!type) res.status(400).end('Error: type query params is allowed');

            if (type === types.general) {
                file = `${this.projectDir}/logs/log.log`;
                filename = `${type}_${today}.log`;
            }

            if (type === types.pm2error) {
                file = `${os.homedir()}/.pm2/logs/skinrobot-worker-error.log`;
                filename = `${type}_${today}.log`;
            }

            if (type === types.pm2out) {
                file = `${os.homedir()}/.pm2/logs/skinrobot-worker-out.log`;
                filename = `${type}_${today}.log`;
            }

            res.download(file, filename, function (err) {
                if (err) res.status(400).end(`Error: ${String(err)}`);
            })
        });

        app.get('/servertime', async (req, res) => {

            const server_date = new Date();
            const server_date_in_unix = new Date() / 1;
            const server_date_now_in_utc = Date.now();
            const today = new Date().toISOString().slice(0, 10)

            res.json({ 
                success: true, 
                server_date: `new Date(): ${server_date}`, 
                server_date_in_unix: `new Date() / 1: ${server_date_in_unix}`,
                server_date_now_in_utc: `Date.now(): ${server_date_now_in_utc}`,
                today: `new Date().toISOString().slice(0, 10): ${today}`
            })
        });

        //query: ?first_pair="bitmex.BTCUSDT"&second_pair="binance.BTCUSDT"
        app.get('/tickers', async (req, res) => {
            const tickers = {};
        
            if (req.query.first_pair && req.query.second_pair) {
                const [first_exchange, first_symbol] = req.query.first_pair.split('.');
                const [second_exchange, second_symbol] = req.query.second_pair.split('.');
                
                tickers.first_pair_data = await this.tickerExportHttp.getTicker(first_exchange, first_symbol);
                tickers.second_pair_data = await this.tickerExportHttp.getTicker(second_exchange, second_symbol);
            }
            
            const options = {
                tickers: JSON.stringify(tickers)
            };
            // console.log('options', options);
            res.render('../templates/ticker.html.twig', options)
        });

        app.get('/tickers/download', async (req, res) => {
            //localhost:3000/tickers/download?date=2021-07-16&period=3000&limit=1000
            //http://206.189.96.37:3000/tickers/download?date=2021-08-03&period=3000&limit=1000
            const {
                date,
                period,
                limit
            } = req.query;
            
            if (!date || !period || !limit) res.status(400).end('Error: date, period and limit query params are allowed');

            const pairs = this.instances.symbols.map(pair => ({
                exchange: pair.exchange,
                symbol: pair.symbol
            }));

            const filename = `${date}_${pairs.map(pair => `${pair.symbol}`).join('_')}_tickers`
            const file = `${this.projectDir}/var/tickers/${filename}.csv`;

            try {
                fs.accessSync(file, fs.constants.F_OK);
                //file exists
            } catch (err) {
                //file is NOT exists
                //We must to create it
                await this.csvExportHttp.saveTickersTableIntoFile(pairs, period, date, file, limit);
            }
            
            res.download(file, filename, function (err) {
                if (err) res.status(400).end(`Error: ${String(err)}`);
            })
        });

        app.get('/changes', async (req, res) => {
            const tickers = await this.candleExportHttp.getCombaineExchangePairs();
            const options = {
                tickers: tickers
            };
            
            res.render('../templates/changes.html.twig', options)
        });

        app.post('/changes.json', async (req, res) => {
            const {
                count,
                period,
                pairs,
                datepicker
            } = req.body;

            let newPairs = [];
            let limit = count;

            if (!pairs || !period || !datepicker) {
                return res.json([]);
            }
            
            if (Array.isArray(pairs) && pairs.length) {
                limit = count * pairs.length;

                pairs.forEach(pair => {
                    const [exchange, symbol] = pair.split('.');
                    newPairs.push({ exchange: exchange, symbol: symbol.toUpperCase() });
                })
            } else if (pairs.length){
                const [exchange, symbol] = pairs.split('.');
                newPairs.push({ exchange: exchange, symbol: symbol.toUpperCase() });
            }

            //Formating start/end time
            const [start, end] = datepicker.split(' - ');
            
            const result = await this.candleExportHttp.getMultiplePairCandles(newPairs, period, start, end, limit);
            res.json(result);
        });

        app.get('/correlation', async (req, res) => {
            const options = {
                tickers: ['binance_futures.btcusdt', 'binance_futures.ethusdt']
            };
            res.render('../templates/correlation.html.twig', options)
        });

        app.post('/correlation.json', async (req, res) => {
            const {
                pairs,
            } = req.body;
            
            if (!pairs) {
                return res.json([]);
            }

            let newPairs = [];
            let times = [];
            const period = '1d';

            if (Array.isArray(pairs) && pairs.length) {
                pairs.forEach(pair => {
                    const [exchange, symbol] = pair.split('.');
                    newPairs.push({ exchange: exchange, symbol: symbol.toUpperCase() });
                })
            } else if (pairs.length){
                const [exchange, symbol] = pairs.split('.');
                newPairs.push({ exchange: exchange, symbol: symbol.toUpperCase() });
            }
            
            const todayStartDayTime = moment.utc().startOf('day').format('X'); //получаем дату начала дня
            const countDaysArray = [100, 30, 7, 3, 1];

            for (let i = 0; i < countDaysArray.length; i++) {
                times.push(todayStartDayTime - (86400 * countDaysArray[i]));
            }

            const result2 = await this.candleExportHttp.calculationBetaAndCorrelation(newPairs, period);
            const result = await this.candleExportHttp.getCandlesSelectivelyOnTime(newPairs, period, times);
            res.json(result);
        });

        app.get('/candles/download', async (req, res) => {
            const {
                pairs,
                period,
                count
            } = req.query;

            let result = [];
            const start = new Date('01/01/2021');
            const end = new Date('04/22/2021');
            

            if (Array.isArray(pairs) && pairs.length) {
                let newPairs = [];
                const limit = count * pairs.length;

                pairs.forEach(pair => {
                    const [exchange, symbol] = pair.split('.');
                    newPairs.push({ exchange: exchange, symbol: symbol.toUpperCase() });
                    //и тут достаем свечи

                })
            } else if (pairs.length){
                let [exchange, symbol] = pairs.split('.');
                symbol = symbol.toUpperCase();
                result = await this.csvExportHttp.downloadOnePairCandles(exchange, symbol, period, start, end, count);
            }
            
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${pairs}.csv`);

            res.status(200).end(result);
        });

        app.get('/changes/download', async (req, res) => {
            //localhost:3000/changes/download?lead=binance_futures.BTCUSDT&driven=binance_futures.LTCUSDT
            const {
                lead,
                driven,
                limit
            } = req.query;

            let result = [];

            if (!lead || !driven) res.status(400).end('Error: lead and driven query params are allowed');

            const split_lead = lead.split('.');
            const leadExchange = split_lead[0];
            const leadSymbol = split_lead[1];

            const split_driven = driven.split('.');
            const drivenExchange = split_driven[0];
            const drivenSymbol = split_driven[1];

            result = await this.csvExportHttp.downloadMeanReversionTable(leadExchange, leadSymbol, drivenExchange, drivenSymbol, limit);
            
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${leadSymbol.toLowerCase()}_${drivenSymbol.toLowerCase()}_indicator__change_.csv`);

            res.status(200).end(result);
        });

        app.get('/signals/download', async (req, res) => {
            const {
                strategy,
                first,
                second,
                limit
            } = req.query;

            let result = [];
            
            result = await this.csvExportHttp.downloadSignalsTable(first, second, strategy, limit);
            
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=signals.csv`);

            res.status(200).end(result);
        });

        app.get('/charts', async (req, res) => {
            const options = {};
            res.render('../templates/charts.html.twig', options)
        });

        app.get('/backfill', async (req, res) => {
            res.json({ success: true, message: '(>___<)' })
        });

        app.get('/backfill/candles', async (req, res) => {
            const options = {
                // pairs: '',//await this.candleExportHttp.getPairs(),
                exchange: 'bitmex_testnet',
                symbol: 'XBTUSD',
                period: '1m',
                start: moment().subtract(30, 'days').toDate(),
                end: new Date()
            };

            if (req.query.pair && req.query.period && req.query.start && req.query.end) {
                const [exchange, symbol] = req.query.pair.split('.');
                options.exchange = exchange;
                options.symbol = symbol;
                options.period = req.query.period;
                options.start = new Date(req.query.start);
                options.end = new Date(req.query.end);
            }

            const candles = await this.candleExportHttp.getCandles(
                options.exchange,
                options.symbol,
                options.period,
                options.start,
                options.end
            );

            if (req.query.metadata) {
                candles.map(c => {
                    c.exchange = exchange;
                    c.symbol = symbol;
                    c.period = req.query.period;
                    return c;
                });
            }

            options.candles = candles;
            // options.candles_json = JSON.stringify(candles, null, 2);
        
            res.json({ success: true, data: options });
        });
        
        const ip = this.systemUtil.getConfig('webserver.ip', '0.0.0.0');
        const port = this.systemUtil.getConfig('webserver.port', 3000);

        app.listen(port, ip);

        console.log(`Webserver listening on: ${ip}:${port}`);
    }
};
