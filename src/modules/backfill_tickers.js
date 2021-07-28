
module.exports = class BackFillTickers {
    constructor(
        eventEmitter,
        logger,
        instances,
        systemUtil,
        tickerDatabaseListener
    ) {
        this.eventEmitter = eventEmitter;
        this.instances = instances;
        this.logger = logger;
        this.systemUtil = systemUtil;
        this.tickerDatabaseListener = tickerDatabaseListener;

        this.tickerLength = 0;

        //TODO DELETE
        this.flag = false;
    }

    start(time = 1000 * 60 * 30) {
        console.log('Backfill Tickers module started...');

        const me = this;
        const { eventEmitter } = this;

        setTimeout(async () => {
            // console.log(`Got: ${this.tickerLength} tickers`);
            console.log('Backfill Tickers module finish');

            process.exit(0);
        }, time);

        eventEmitter.on('ticker', function(tickerEvent) {
            if (new Date().getUTCHours() === 0 && !this.flag) { //TODO DELETE
                this.flag = true;
            }

            if (this.flag) {
                me.tickerDatabaseListener.onTicker(tickerEvent); //save ticker at db with delay
            }
        });
    }
};
