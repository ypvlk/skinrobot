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

        this.files_data = {};

        this.is_test = true;
        this.nullify = false;
        this.exchange_commission = 0.08; //TODO
    }

    init(options) {
        const me = this;

        let _files = [];

        if (!Object.keys(options).length) throw new Error(`Parse error options: ${options}`);

        const _opt = TickersStreamService.parseOptions(options);

        const {date, limit, period, } = options;
        
        //Жду 30 сек и начинаю доставать тикеры с бд
        setTimeout(async () => {
            me.logger.debug('Tickers stream service warmup done; starting ticks...');
            console.log('Tickers stream service warmup done; starting ticks...');

            //Я достаю с инстансов стаки(биржу и символы)
            const pairs = this.instances.symbols.map(pair => ({
                exchange: pair.exchange,
                symbol: pair.symbol
            }));

            const parse_date = new Date(date) / 1;

            for (let k = 0; k < _opt.length; k++) {
                _opt[k].nullify = true; //Этот ключ означает что начинаем с новыми параметрами

                let startTime = moment(parse_date).utc().startOf('day').unix() * 1000; 
                let endTime = moment(parse_date).utc().endOf('day').unix() * 1000; 

                let tickersFromDB;
                
                do {
                    if (startTime > endTime) break;
                    
                    tickersFromDB = await me.tickerExportHttp.getMultipleTickers(
                        pairs, 
                        period, 
                        startTime, 
                        endTime, 
                        limit
                    );
                    
                    if (tickersFromDB && tickersFromDB.length > pairs.length / 2) { 
                        let j = 0;

                        for(let i = 0; i < tickersFromDB.length / pairs.length; i++) {
                            if (!tickersFromDB[j + 1]) break;
    
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

                            _opt[k].nullify = false; //Это поменял нужно проверить работает так или нет(был над while)
                        }
                    }

                } while (tickersFromDB && tickersFromDB.length > limit - 1); 

                //Тут достаем данные с мониторинга в отбект
                me.files_data = {
                    pairs: `${pairs[0].symbol}/${pairs[1].symbol}`, 
                    correction: _opt[k].correction_indicator_changes,
                    get_pos: _opt[k].get_position_change_tier_1,
                    take_profit: _opt[k].take_profit_position_change,
                    e1: '',
                    all_pos: me.backtestingStorage.getAllPositions(),
                    plus_pos: me.backtestingStorage.getPositivePositions(),
                    neg_pos: me.backtestingStorage.getNegativePositions(),
                    drawdown: me.backtestingStorage.getDrawdown(),
                    bal: me.backtestingStorage.getBalance(),
                    bal_comm: me.backtestingStorage.getBalanceWithComm(),
                    e2: '',
                    max_pos_profit: me.backtestingStorage.getMaxPositionProfit(),
                    max_pos_lose: me.backtestingStorage.getMaxPositionLose(),
                    min_pos_profit: me.backtestingStorage.getMinPositionProfit(),
                    min_pos_lose: me.backtestingStorage.getMinPositionLose(),
                    avr_pos_profit: me.backtestingStorage.getAveragePositionProfit(),
                    avr_pos_lose: me.backtestingStorage.getAveragePositionLose()
                }

                _files.push(me.files_data);
            }

            const filename = `${pairs[0].symbol}_${pairs[1].symbol}`;
            const path = `${me.projectDir}/var/backtesting/${filename}_${date}.csv`;

            const fields = Object.keys(me.files_data);

            me.csvExportHttp.saveSyncIntoFile(_files, path, fields);

            me.logger.debug(`Tickers stream service stoped.`);
            console.log(`Tickers stream service stoped.`);

            setTimeout(async () => {
                process.exit(0);
            }, 3000);

        }, me.systemUtil.getConfig('settings.warmup_time', 30000));
    }
    
    static parseOptions(options) {

        const {
            correction,
            get_position,

        } = options;

        let result = [];
        let corrections = [];
        let get_positions = [];

        if (correction && correction.length) {
            const correction_step = 0.01; //it's contant
            const correction_start = +options.correction[0];
            const correction_end = +options.correction[1] + correction_step;
            
            corrections = TickersStreamService.arrayFromRange(correction_step, correction_start, correction_end);
        }

        if (get_position && get_position.length) {
            const gposition_step = 0.01; //it's contant
            const gposition_start = +get_position[0];
            const gposition_end = +get_position[1] + gposition_step;

            get_positions = TickersStreamService.arrayFromRange(gposition_step, gposition_start, gposition_end);
        }
        
        for (let i = 0; i < corrections.length; i++) {
            for (let j = 0; j < get_positions.length; j++) {
                result.push({
                    correction_indicator_changes: corrections[i],
                    get_position_change_tier_1: get_positions[j],
                    take_profit_position_change: +options.take_profit,
                    is_test: true,
                    nullify: false,
                    commission: +options.exchange_commission
                });
            }
        }

        return result;
    }

    static arrayFromRange(step, start, end) {
        //https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
        if (step && start && end) {
            return _.range(start, end, step);
        } else {
            return [start];
        }
    }
};
