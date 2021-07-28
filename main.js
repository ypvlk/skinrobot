// https://github.com/Haehnchen/crypto-trading-bot

const program = require('commander');
const TradeCommand = require('./src/command/trade');
const ServerCommand = require('./src/command/server');
const BackfillCandlesCommand = require('./src/command/backfill_candles');
const BackfillTickersCommand = require('./src/command/backfill_tickers');
const WatchCommand = require('./src/command/watch');
const BacktestingCommand = require('./src/command/backtesting');

// init
const services = require('./src/modules/services');

program
    .command('watch')
    .description('start crypto trading bot with watch option')
    .option('-ws, --websocket <websocket>')
    .action(async options => {
        await services.boot(__dirname);
        const cmd = new WatchCommand();
        cmd.execute(options);
    });

program
    .command('trade')
    .description('start crypto trading bot')
    .option('-ws, --websocket <websocket>')
    .action(async options => {
        await services.boot(__dirname);
        const cmd = new TradeCommand();
        cmd.execute(options);
    });

program
    .command('backfill_candles')
    .description('process getting historical candles data and saving into db')
    .option('-e, --exchange <exchange>')
    .option('-s, --symbol <symbol>')
    .option('-p, --period <period>', '1d')
    .option('-d, --days <days>', 'days in past to collect start', '7')
    .action(async options => {
        
        if (!options.exchange || !options.symbol || !options.period || !options.days) {
            throw new Error('Not all options are given');
        }

        await services.boot(__dirname);

        const cmd = new BackfillCandlesCommand();
        
        await cmd.execute(options.exchange, options.symbol, options.period, options.days);

        process.exit();
    });

program
    .command('backfill_tickers')
    .description('process getting tickers data in real time and saving into db')
    .option('-h, --hours <hours>', 'time in hours to collect data')
    .action(async options => {
        
        if (!options.hours) {
            throw new Error('<hours> parameter cannot be empty');
        }

        const time = +options.hours * 3600000; //3600000 - 1 hour in mill

        await services.boot(__dirname);

        const cmd = new BackfillTickersCommand();
        cmd.execute(time);
    });

program
    .command('backtesting')
    .description('process testing strategy on saved data and params')
    .option('-d, --date <date>')
    .option('-c, --correction [correction...]')
    .option('-g, --gposition [gposition...]')
    .option('-tp, --tprofit <tprofit>')
    .option('-p, --period <period>', '3000')
    .option('-l, --limit <limit>', '100')
    .action(async options => {

        if (!options.date || !options.correction || !options.gposition || !options.tprofit) {
            throw new Error('Not all options are given');
        }

        await services.boot(__dirname);

        const cmd = new BacktestingCommand();
        cmd.execute(options);
    });

program
    .command('server')
    .description('run http server')
    .option('-ws, --websocket <websocket>')
    .action(async options => {
        await services.boot(__dirname);
        const cmd = new ServerCommand();
        cmd.execute(options);
    });

program.parse(process.argv);
