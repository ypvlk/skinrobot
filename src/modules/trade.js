const moment = require('moment');
const crypto = require('crypto');
const os = require('os');

module.exports = class Watch {
    constructor(
        eventEmitter,
        logger,
        instances,
        systemUtil,
        logsRepository,
        tickerRepository,
        tickers,
        tickerDatabaseListener,
        tickListener,
        signalDatabaseListener,
        signalListener,
        strategyDatabaseListener,
        orders,
        positions,
        actionListener,
        balances,
        actionDatabaseListener,
        csvExportHttp,
        projectDir
    ) {
        this.eventEmitter = eventEmitter;
        this.instances = instances;
        this.logger = logger;
        this.systemUtil = systemUtil;
        this.logsRepository = logsRepository;
        this.tickerRepository = tickerRepository;
        this.tickers = tickers;
        this.tickerDatabaseListener = tickerDatabaseListener;
        this.tickListener = tickListener;
        this.signalDatabaseListener = signalDatabaseListener;
        this.signalListener = signalListener;
        this.strategyDatabaseListener = strategyDatabaseListener;
        this.orders = orders;
        this.positions = positions;
        this.actionListener = actionListener;
        this.balances = balances;
        this.actionDatabaseListener = actionDatabaseListener;
        this.csvExportHttp = csvExportHttp;
        this.projectDir = projectDir;

        this.end_day_pause = false;
        // this.action_pause = false;
    }

    start(options) {
        this.logger.debug('Trade module started...');

        process.on('SIGINT', async () => {
            // force exit in any case
            setTimeout(() => {
                process.exit(0);
            }, 7500);
            
            await this.actionListener.onTerminate();
        });

        const instanceId = crypto.randomBytes(4).toString('hex');

        const notifyActivePairs = this.instances.symbols.map(symbol => {
            return `${symbol.exchange}.${symbol.symbol}`;
        });

        const message = `Start: ${instanceId} - ${os.hostname()} - ${os.platform()} - ${moment().format()} - ${notifyActivePairs.join(
            ', '
        )}`;
        
        this.logger.info(message);
        console.log(message);

        const me = this;
        const { eventEmitter } = this;
        const { tickers } = this;
        const { orders } = this;
        const { positions } = this;
        const { balances } = this;
        
        // let the system bootup; eg let the candle be filled by exchanges
        setTimeout(() => {
            console.log('Trade module: warmup done; starting ticks');
            me.logger.info('Trade module: warmup done; starting ticks');

            setInterval(() => {
                const date = new Date();
                //TODO нужно что то сделать с этой паузуй там
                if (
                    date.getUTCHours() === 23 && 
                    date.getUTCMinutes() >= 45 && 
                    date.getUTCMinutes() <= 55 && 
                    !me.end_day_pause
                ) {
                    me.end_day_pause = true;
                    setTimeout(() => { me.end_day_pause = false;}, 1000 * 60 * 14);
                    me.saveTickersTableIntoFile();
                }

                if (!me.end_day_pause) me.tickListener.onTick();

            }, me.systemUtil.getConfig('settings.on_tick_time', 1000));

        }, me.systemUtil.getConfig('settings.warmup_time', 30000));

        setInterval(async () => {
            await me.logsRepository.cleanOldLogEntries();
            await me.tickerRepository.cleanOldLogEntries();

            me.logger.debug('Logs: Cleanup old entries');
        }, 86455000 * 2); //3 day

        eventEmitter.on('ticker', function(tickerEvent) {
            tickers.set(tickerEvent.ticker); //save at storage
            me.tickerDatabaseListener.onTicker(tickerEvent); //save ticker at db with delay
        });

        eventEmitter.on('tick_signal', async function(signalEvent) {
            // await me.strategyDatabaseListener.saveData(signalEvent); //save strategy data at db 
            // await me.signalDatabaseListener.saveSignal(signalEvent); //save signal at db
            
            if (signalEvent.signals && signalEvent.signals.length > 0) {
                me.signalListener.onSignal(signalEvent.signals);
            }
        });

        eventEmitter.on('exchange_balance', function(balance) {
            balances.set(balance);
        });

        eventEmitter.on('exchange_order', function(orderEvent) {
            switch (orderEvent.getAction()) {
                case 'SAVE':
                  orders.set(orderEvent); //save at storage
                    return;
                case 'DELETE':
                  orders.del(orderEvent.getExchange(), orderEvent.getSymbol(), orderEvent.getOrder().getStatus()); //delete at storage
                    return;
                default:
                    me.logger.info(`Invalid exchange order event action: ${orderEvent.getAction()}`);
                    return;
            }
        });

        eventEmitter.on('exchange_position', function(positionEvent) {
            switch (positionEvent.getAction()) {
                case 'SAVE':
                    positions.set(positionEvent); //save at storage
                    return;
                case 'DELETE':
                    positions.del(positionEvent.getExchange(), positionEvent.getSymbol())//delete at storage
                    return;
                default:
                    me.logger.info(`Invalid exchange position event action: ${positionEvent.getAction()}`);
                    return;
            }
        });

        eventEmitter.on('actions',  async actionsEvent => {
            // await me.actionDatabaseListener.insertActions(actionsEvent);
            await me.actionListener.onActions(actionsEvent.actions);
        });

        // eventEmitter.on('trade_pause', pause => {
        //     me.action_pause = pause.pause;
        // });
        
    }

    saveTickersTableIntoFile() {
        const limit = 1000;
        const period = 3000;

        const pairs = this.instances.symbols.map(pair => ({
            exchange: pair.exchange,
            symbol: pair.symbol
        }));

        const date = new Date().toISOString().slice(0, 10);

        const filename = `${date}_${pairs.map(pair => `${pair.symbol}`).join('_')}_tickers.csv`;
        const path = `${this.projectDir}/var/tickers/${filename}`;

        return this.csvExportHttp.saveTickersTableIntoFile(pairs, period, date, path, limit);
    }
};
