const _ = require('lodash');
const moment = require('moment');

const Ticker = require('../../dict/ticker');

module.exports = class TickersStreamService {
    constructor(
        eventEmitter, 
        logger, 
        instances, 
        systemUtil, 
        tickerExportHttp,
        tickers,
        backtestingStorage,
        csvExportHttp,
        projectDir
    ) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.instances = instances;
        this.systemUtil = systemUtil;
        this.tickerExportHttp = tickerExportHttp;
        this.tickers = tickers;
        this.backtestingStorage = backtestingStorage;
        this.csvExportHttp = csvExportHttp;
        this.projectDir = projectDir;

        this.dataFromMonitoring = {};

        this.is_test = true;
        this.nullify = false;
        this.exchange_commission = 0.08;
    }

    init(options = {}) {
        const me = this;

        let _files = [];

        const _opt = this.parseOptions(options);
        
        //Жду 30 сек и начинаю доставать тикеры с бд
        setTimeout(async () => {
            console.log('Tickers stream service warmup done; starting ticks...');

            //Я достаю с инстансов стаки(биржу и символы)
            const pairs = this.instances.symbols.map(pair => ({
                exchange: pair.exchange,
                symbol: pair.symbol
            }));

            const limit = options.limit ? +options.limit : 1000;
            const period = options.period ? +options.period : 3000;

            const date = new Date(options.date) / 1;

            for (let k = 0; k < _opt.length; k++) {
                console.time('iteration');
                _opt[k].nullify = true;

                let startTime = moment(date).utc().startOf('day').unix() * 1000; 
                let endTime = moment(date).utc().endOf('day').unix() * 1000; 

                let tickersFromDB;
                
                do {
                    if (startTime > endTime) break;
                    
                    tickersFromDB = await me.tickerExportHttp.getMultipleTickers(pairs, period, startTime, endTime, limit);
                    
                    if (tickersFromDB && tickersFromDB.length > pairs.length / 2) {
                        let j = 0;

                        for(let i = 0; i < tickersFromDB.length / pairs.length; i++) {
                            if (!tickersFromDB[j + 1]) return;
    
                            const t = [tickersFromDB[j], tickersFromDB[j+1]];
    
                            t.forEach(ticker => {
                                //update ticker income time
                                if (ticker.income_at > startTime) startTime = ticker.income_at;
    
                                //save at storage
                                me.tickers.set(new Ticker(
                                    ticker.exchange,
                                    ticker.symbol,
                                    ticker.income_at,
                                    ticker.bidPrice,
                                    ticker.bidSize,
                                    ticker.askPrice,
                                    ticker.askSize,
                                    ticker.close
                                ));
                            });

                            j = j + 2;
                            
                            me.eventEmitter.emit('tick', _opt[k]);
                        }
                    }

                    _opt[k].nullify = false;

                } while (tickersFromDB && tickersFromDB.length > limit - 1); 

                //Тут достаем данные с мониторинга в отбект
                me.dataFromMonitoring = {
                    pairs: `${pairs[0].symbol}/${pairs[1].symbol}`, 
                    correction: _opt[k].correction_indicator_changes,
                    get_pos: _opt[k].get_position_change_tier_1,
                    take_profit: _opt[k].take_profit_position_change,
                    e1: '',
                    all_pos: this.backtestingStorage.getAllPositions(),
                    plus_pos: this.backtestingStorage.getPositivePositions(),
                    neg_pos: this.backtestingStorage.getNegativePositions(),
                    drawdown: this.backtestingStorage.getDrawdown(),
                    bal: this.backtestingStorage.getBalance(),
                    bal_comm: this.backtestingStorage.getBalanceWithComm(),
                    e2: '',
                    max_pos_profit: this.backtestingStorage.getMaxPositionProfit(),
                    max_pos_lose: this.backtestingStorage.getMaxPositionLose(),
                    min_pos_profit: this.backtestingStorage.getMinPositionProfit(),
                    min_pos_lose: this.backtestingStorage.getMinPositionLose(),
                    avr_pos_profit: this.backtestingStorage.getAveragePositionProfit(),
                    avr_pos_lose: this.backtestingStorage.getAveragePositionLose()
                }

                _files.push(me.dataFromMonitoring);
                console.timeEnd('iteration');
            }

            const filename = `${pairs[0].symbol}_${pairs[1].symbol}`;
            const today = new Date().toISOString().slice(0, 10);
            const fields = Object.keys(me.dataFromMonitoring);
            const path = `${me.projectDir}/var/backtesting/${filename}_${today}.csv`;

            me.csvExportHttp.saveSyncIntoFile(_files, path, fields);

            console.log(`Tickers stream service stoped.`);

            setTimeout(async () => {
                process.exit(0);
            }, 3000);

        }, me.systemUtil.getConfig('settings.warmup_time', 30000));
    }
    
    parseOptions(options) {
        //https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp

        let result = [];
        let corrections = [];
        let gpositions = [];

        const tprofit = options.tprofit ? +options.tprofit : 0.05;

        if (options.correction && options.correction.length) {

            const correction_step = 0.01;
            const correction_start = +options.correction[0];
            const correction_end = +options.correction[1] + 0.01;
            
            corrections = this.arrayFromRange(correction_step, correction_start, correction_end);
        }

        if (options.gposition && options.gposition.length) {
            const gposition_step = 0.01;
            const gposition_start = +options.gposition[0];
            const gposition_end = +options.gposition[1];

            gpositions = this.arrayFromRange(gposition_step, gposition_start, gposition_end);
        }
        
        for (let i = 0; i < corrections.length; i++) {
            for (let j = 0; j < gpositions.length; j++) {
                result.push({
                    correction_indicator_changes: corrections[i],
                    get_position_change_tier_1: gpositions[j],
                    take_profit_position_change: tprofit,
                    is_test: this.is_test,
                    nullify: this.nullify,
                    commission: this.exchange_commission
                });
            }
        }

        return result;
    }

    arrayFromRange(step, start, end) {
        if (step && start && end) {
            return _.range(start, end, step);
        } else {
            return [start];
        }
    }
};
