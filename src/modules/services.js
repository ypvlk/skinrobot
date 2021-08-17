const fs = require('fs');
const events = require('events');

const { createLogger, transports, format } = require('winston');

const _ = require('lodash');
const Sqlite = require('better-sqlite3');

const Trade = require('../modules/trade');
const Http = require('../modules/http');
const Watch = require('../modules/watch');
const Ws = require('../modules/ws');
const Monitoring = require('./monitoring/monitoring');

const BackfillCandles = require('./backfill_candles');
const BackfillTickers = require('./backfill_tickers');
const Backtesting = require('./backtesting/backtesting');

const Binance = require('../exchange/binance');
const Bitmex = require('../exchange/bitmex');
const BitmexTestnet = require('../exchange/bitmex_testnet');
const Bitfinex = require('../exchange/bitfinex');
const BinanceFutures = require('../exchange/binance_futures');
const Bybit = require('../exchange/bybit');
const Ftx = require('../exchange/ftx');
const Kucoin = require('../exchange/kucoin');
const MarketStack = require('../exchange/marketstack');

const SystemUtil = require('../modules/system/system_util');
const CandleImporter = require('../modules/system/candle_importer');
const CandleExportHttp = require('../modules/system/candle_export_http');
const TickerExportHttp = require('../modules/system/ticker_export_http');
const CsvExportHttp = require('../modules/system/csv_export_http');

const LogsRepository = require('../modules/repository/logs_repository');
const CandlestickRepository = require('../modules/repository/candlestick_repository');
const TickerRepository = require('../modules/repository/ticker_repository');
const SignalRepository = require('../modules/repository/signal_repository');
const ActionRepository = require('../modules/repository/action_repository');
const MeanReversionRepository = require('./repository/mean_reversion_repository');

const ExchangeManager = require('./exchange/exchange_manager');
const StrategyManager = require('./strategy/strategy_manager');
const TickersStreamService = require('./backtesting/tickers_stream_service');

const TickListener = require('../modules/listener/tick_listener');
const SignalListener = require('../modules/listener/signal_listener');
const TickerDatabaseListener = require('../modules/listener/ticker_database_listener');
const SignalDatabaseListener = require('../modules/listener/signal_database_listener');
const StrategyDatabaseListener = require('../modules/listener/strategy_database_listener');
const ActionListener = require('../modules/listener/action_listener');
const ActionDatabaseListener = require('../modules/listener/action_database_listener');

const Tickers = require('../storage/tickers');
const Orders = require('../storage/orders');
const Positions = require('../storage/positions');
const Balances = require('../storage/balances');
const BacktestingMonitoringService = require('./monitoring/backtesting_monitoring');

const Throttler = require('../utils/throttler');
const Queue = require('../utils/queue');
const LogsHttp = require('./system/logs_http');
const WinstonSqliteTransport = require('../utils/winston_sqlite_transport');
const RequestClient = require('../utils/request_client');


let db;
let instances;
let config;
let eventEmitter;
let logger;
let systemUtil;
let logsHttp;
let logsRepository;
let exchanges;
let candleStickImporter;
let candlestickRepository;
let throttler;
let queue;
let requestClient;
let candlestickResample;
let candleExportHttp;
let tickerExportHttp;
let exchangeManager;
let tickListener;
let tickers;
let tickerDatabaseListener;
let tickerRepository;
let strategyManager;
let signalRepository;
let signalDatabaseListener;
let signalListener;
let csvExportHttp;
let meanReversionRepository;
let strategyDatabaseListener;
let orders;
let positions;
let actionListener;
let balances;
let actionDatabaseListener;
let actionRepository;
let tickersStreamService;
let backtestingMonitoringService;

const parameters = {};

module.exports = {
  boot: async function(projectDir) {
    parameters.projectDir = projectDir;

    try {
      instances = require(`${parameters.projectDir}/instance`);
    } catch (e) {
      throw new Error(`Invalid instance.js file. Please check: ${String(e)}`);
    }

    try {
      config = JSON.parse(fs.readFileSync(`${parameters.projectDir}/config/conf.json`, 'utf8'));
    } catch (e) {
      throw new Error(`Invalid conf.json file. Please check: ${String(e)}`);
    }

    this.getDatabase();
  },

  getDatabase: () => {
    // sqlite3 database.db -init dump.sql
    if (db) {
      return db;
    }

    const myDb = Sqlite('bot.db');
    myDb.pragma('journal_mode = WAL');

    myDb.pragma('SYNCHRONOUS = 1;');
    myDb.pragma('LOCKING_MODE = EXCLUSIVE;');

    return (db = myDb);
  },

  getInstances: () => {
    return instances;
  },

  getConfig: () => {
    return config;
  },

  getEventEmitter: function() {
    if (eventEmitter) {
      return eventEmitter;
    }

    return (eventEmitter = new events.EventEmitter());
  },

  getLogger: function() {
    if (logger) {
      return logger;
    }

    return (logger = createLogger({
      format: format.combine(format.timestamp(), format.json()),
      transports: [
          new transports.File({
            filename: `${parameters.projectDir}/logs/log.log`,
            level: 'debug'
          }),
          new transports.Console({
            level: 'error'
          }),
          new WinstonSqliteTransport({
            level: 'debug',
            database_connection: this.getDatabase(),
            table: 'logs'
          })
      ]
    }));
  },

  getSystemUtil: function() {
    if (systemUtil) {
      return systemUtil;
    }

    return (systemUtil = new SystemUtil(this.getConfig()));
  },

  getLogsRepository: function() {
    if (logsRepository) {
      return logsRepository;
    }

    return (logsRepository = new LogsRepository(this.getDatabase()));
  },

  getMeanReversionRepository: function() {
    if (meanReversionRepository) {
      return meanReversionRepository;
    }

    return (meanReversionRepository = new MeanReversionRepository(this.getDatabase()));
  },

  getLogsHttp: function() {
    if (logsHttp) {
      return logsHttp;
    }

    return (logsHttp = new LogsHttp(this.getLogsRepository()));
  },

  //искуственная задержка
  //Выставляем это значение в зависимости от лимитов биржи
  //https://learn.javascript.ru/task/throttle
  getThrottler: function() {
      if (throttler) {
        return throttler;
      }

      return (throttler = new Throttler(this.getLogger()));
  },

  getCandlestickRepository: function() {
    if (candlestickRepository) {
      return candlestickRepository;
    }

    return (candlestickRepository = new CandlestickRepository(this.getDatabase()));
  },

  getCandleImporter: function() {
    if (candleStickImporter) {
      return candleStickImporter;
    }

    return (candleStickImporter = new CandleImporter(this.getCandlestickRepository()));
  },

  getCandlestickResample: function() {
    if (candlestickResample) {
      return candlestickResample;
    }

    return (candlestickResample = new CandlestickResample(this.getCandlestickRepository(), this.getCandleImporter()));
  },

  getCandleExportHttp: function() {
    if (candleExportHttp) {
      return candleExportHttp;
    }

    return (candleExportHttp = new CandleExportHttp(this.getCandlestickRepository()));
  },

  getCsvExportHttp: function() {
    if (csvExportHttp) {
      return csvExportHttp;
    }

    return (csvExportHttp = new CsvExportHttp(
      this.getCandlestickRepository(),
      this.getMeanReversionRepository(),
      this.getSignalRepository(),
      this.getTickerRepository(),
      this.getLogger(),
      parameters.projectDir
      )
    );
  },

  getQueue: function() {
    if (queue) {
      return queue;
    }

    return (queue = new Queue());
  },

  getRequestClient: function() {
    if (requestClient) {
      return requestClient;
    }

    return (requestClient = new RequestClient(this.getLogger()));
  },

  getExchanges: function() {
    if (exchanges) {
      return exchanges;
    }

    return (exchanges = [
      new Bitmex(
        this.getEventEmitter(),
        this.getRequestClient(),
        // this.getCandlestickResample(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new BitmexTestnet(
        this.getEventEmitter(),
        this.getRequestClient(),
        // this.getCandlestickResample(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new Bitfinex(
        this.getEventEmitter(), 
        this.getLogger(), 
        // this.getRequestClient(), 
        this.getCandleImporter()
      ),
      new Binance(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new BinanceFutures(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter(),
        this.getThrottler(),
        this.getRequestClient()
      ),
      new Bybit(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new Ftx(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new Kucoin(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
      new MarketStack(
        this.getEventEmitter(),
        this.getLogger(),
        this.getQueue(),
        this.getCandleImporter()
      ),
    ]);
  },

  getTickers: function() {
    if (tickers) {
      return tickers;
    }

    return (tickers = new Tickers());
  },

  getOrders: function() {
    if (orders) {
      return orders;
    }

    return (orders = new Orders());
  },

  getPositions: function() {
    if (positions) {
      return positions;
    }

    return (positions = new Positions());
  },

  getBalances: function() {
    if (balances) {
      return balances;
    }

    return (balances = new Balances());
  },

  getTickerRepository: function() {
    if (tickerRepository) {
      return tickerRepository;
    }

    return (tickerRepository = new TickerRepository(this.getDatabase(), this.getLogger()));
  },

  getTickerDatabaseListener: function() {
    if (tickerDatabaseListener) {
      return tickerDatabaseListener;
    }

    return (tickerDatabaseListener = new TickerDatabaseListener(
      this.getTickerRepository(),
      this.getSystemUtil(),
      this.getInstances()
    ));
  },

  getSignalRepository: function() {
    if (signalRepository) {
      return signalRepository;
    }

    return (signalRepository = new SignalRepository(this.getDatabase(), this.getLogger()));
  },

  getActionRepository: function() {
    if (actionRepository) {
      return actionRepository;
    }

    return (actionRepository = new ActionRepository(this.getDatabase()));
  },

  getBacktestingMonitoringService: function() {
    if (backtestingMonitoringService) {
      return backtestingMonitoringService;
    }

    return (backtestingMonitoringService = new BacktestingMonitoringService());
  },

  getSignalDatabaseListener: function() {
    if (signalDatabaseListener) {
      return signalDatabaseListener;
    }

    return (signalDatabaseListener = new SignalDatabaseListener(this.getSignalRepository()));
  },

  getStrategyDatabaseListener: function() {
    if (strategyDatabaseListener) {
      return strategyDatabaseListener;
    }

    return (strategyDatabaseListener = new StrategyDatabaseListener(
      this.getMeanReversionRepository(),
      this.getBacktestingMonitoringService()
    ));
  },

  getActionDatabaseListener: function() {
    if (actionDatabaseListener) {
      return actionDatabaseListener;
    }

    return (actionDatabaseListener = new ActionDatabaseListener(
      this.getActionRepository()
    ));
  },
  

  getTickerExportHttp: function() {
    if (tickerExportHttp) {
      return tickerExportHttp;
    }

    return (tickerExportHttp = new TickerExportHttp(this.getTickerRepository()));
  },

  getStrategyManager: function() {
    if (strategyManager) {
      return strategyManager;
    }

    return (strategyManager = new StrategyManager(
      this.getEventEmitter(),
      this.getLogger(), 
      parameters.projectDir
    ));
  },

  getTickListener: function() {
    if (tickListener) {
      return tickListener;
    }

    return (tickListener = new TickListener(
      this.getTickers(),
      this.getInstances(),
      this.getStrategyManager(),
      this.getExchangeManager(),
      this.getEventEmitter(),
      this.getLogger(),
      this.getPositions(),
      this.getOrders(),
      this.getSystemUtil()
    ));
  },

  getSignalListener: function() {
    if (signalListener) {
      return signalListener;
    }

    return (signalListener = new SignalListener(
      this.getExchangeManager(),
      this.getEventEmitter(),
      this.getLogger(),
      this.getSystemUtil()
    ));
  },

  getActionListener: function() {
    if (actionListener) {
      return actionListener;
    }

    return (actionListener = new ActionListener(
      this.getEventEmitter(),
      this.getLogger(),
      this.getExchangeManager(),
      this.getOrders(),
      this.getPositions(),
      this.getSystemUtil(),
      this.getThrottler()
    ));
  },

  getTickersStreamService: function() {
    if (tickersStreamService) {
      return tickersStreamService;
    }

    return (tickersStreamService = new TickersStreamService(
      this.getEventEmitter(),
      this.getLogger(),
      this.getInstances(),
      this.getSystemUtil(),
      this.getTickerExportHttp(),
      this.getTickers(),
      this.getBacktestingMonitoringService(),
      this.getCsvExportHttp(),
      parameters.projectDir,
    ));
  },

  getExchangeManager: function() {
    if (exchangeManager) {
      return exchangeManager;
    }

    return (exchangeManager = new ExchangeManager(
      this.getExchanges(),
      this.getLogger(),
      this.getInstances(),
      this.getConfig()
    ));
  },

  getBackfillCandles: function() {
    return new BackfillCandles(
      this.getExchanges(), 
      this.getCandleImporter()
    );
  },

  createBacktestingInstance: function() {
    return new Backtesting(
      this.getEventEmitter(),
      this.getLogger(),
      this.getTickers(),
      this.getTickListener(),
      this.getSignalDatabaseListener(),
      this.getSignalListener(),
      this.getStrategyDatabaseListener(),
      this.getActionDatabaseListener()
    )
  },

  createBackfillTickersInstance: function() {
    this.getExchangeManager().init();
    
    return new BackfillTickers(
      this.getEventEmitter(),
      this.getLogger(),
      this.getInstances(),
      this.getSystemUtil(),
      this.getTickerDatabaseListener(),
    );
  },

  createMonitoringInstance: function() {
    return new Monitoring(
      this.getEventEmitter(),
      this.getBalances(),
      this.getOrders(),
      this.getPositions(),
      this.getTickers(),
      this.getLogger()
    );
  },

  createWebserverInstance: function() {
    return new Http(
      this.getSystemUtil(),
      this.getLogger(),
      this.getLogsHttp(),
      this.getCandleExportHttp(),
      this.getTickerExportHttp(),
      this.getCsvExportHttp(),
      this.getInstances(),
      this.getEventEmitter(),
      parameters.projectDir
    );
  },

  createWebSocketInstance: function() {
    return new Ws(
      this.getSystemUtil(),
      this.getLogger(),
      this.getTickers(),
      this.getEventEmitter(),
      parameters.projectDir,
    );
  },

  createTradeInstance: function() {
      this.getStrategyManager().init();
      this.getExchangeManager().init();

      return new Trade(
        this.getEventEmitter(),
        this.getLogger(),
        this.getInstances(),
        this.getSystemUtil(),
        this.getLogsRepository(),
        this.getTickerRepository(),
        this.getTickers(),
        this.getTickerDatabaseListener(),
        this.getTickListener(),
        this.getSignalDatabaseListener(),
        this.getSignalListener(),
        this.getStrategyDatabaseListener(),
        this.getOrders(),
        this.getPositions(),
        this.getActionListener(),
        this.getBalances(),
        this.getActionDatabaseListener(),
        this.getCsvExportHttp(),
        parameters.projectDir
      );
  },

  createWatchInstance: function() {
      this.getStrategyManager().init();
      this.getExchangeManager().init();

      return new Watch(
        this.getEventEmitter(),
        this.getLogger(),
        this.getInstances(),
        this.getSystemUtil(),
        this.getLogsRepository(),
        this.getTickerRepository(),
        this.getTickers(),
        this.getTickerDatabaseListener(),
        this.getTickListener(),
        this.getSignalDatabaseListener(),
        this.getSignalListener(),
        this.getStrategyDatabaseListener(),
        this.getOrders(),
        this.getPositions(),
        this.getActionListener(),
        this.getBalances(),
        this.getActionDatabaseListener(),
        this.getCsvExportHttp(),
        parameters.projectDir
      );
  }
};
