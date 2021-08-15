const _ = require('lodash');

module.exports = class TickerDatabaseListener {
    constructor(
        tickerRepository, 
        systemUtil,
        instances
    ) {
        this.trottle = {};

        this.delay = systemUtil.getConfig('settings.on_tick_time', 500); //time in mill how long times save tickers to db
        this.count = instances.symbols && instances.symbols.length || 0; //numbers how tickers we must wait before run query to db

        setInterval(async () => {
            const tickers = Object.values(this.trottle);
            this.trottle = {};

            if (tickers.length > this.count - 1) {
                for (const chunk of _.chunk(tickers, 100)) {
                    await tickerRepository.insertTickers(chunk, this.delay);
                }
            }
        }, this.delay);

        
    }

    onTicker(tickerEvent) {
        const { ticker } = tickerEvent;
        this.trottle[ticker.symbol + ticker.exchange] = ticker;
    }
};
