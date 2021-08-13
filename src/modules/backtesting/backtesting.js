
module.exports = class Backtesting {
    constructor(
        eventEmitter,
        logger,
        tickers,
        tickListener,
        signalDatabaseListener,
        signalListener,
        strategyDatabaseListener,
        actionDatabaseListener
    ) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.tickers = tickers;
        this.tickListener = tickListener;
        this.signalDatabaseListener = signalDatabaseListener;
        this.signalListener = signalListener;
        this.strategyDatabaseListener = strategyDatabaseListener;
        this.actionDatabaseListener = actionDatabaseListener;
    }

    start(options = {}) {
        this.logger.debug('Backtesting module started...');
        console.log('Backtesting module started...');

        const me = this;
        const { eventEmitter } = this;

        eventEmitter.on('tick', function(options) {
            me.tickListener.onTick(options);
        });

        eventEmitter.on('tick_signal', async function(signalEvent) {
            await me.strategyDatabaseListener.saveData(signalEvent); //save strategy data at db 
            // await me.signalDatabaseListener.saveSignal(signalEvent); //save signal at db
            
            // if (signalEvent.signals && signalEvent.signals.length > 0) {
            //     console.log('GET SIGNAL EVENT');
            //     me.signalListener.onSignal(signalEvent.signals);
            // }
        });

        eventEmitter.on('actions',  async actionsEvent => {
            // console.log('GET ACTION EVENT');
            // await this.actionDatabaseListener.insertActions(actionsEvent);
        });
    }
};
