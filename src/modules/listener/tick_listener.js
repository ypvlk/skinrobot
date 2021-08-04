const moment = require('moment');
const _ = require('lodash');

const ExchangeOrder = require('../../dict/exchange_order');

module.exports = class TickListener {
    constructor(
        tickers,
        instances,
        strategyManager,
        exchangeManager,
        eventEmitter,
        logger,
        exchangePositions,
        exchangeOrders,
        systemUtil
    ) {
        this.tickers = tickers;
        this.instances = instances;
        this.strategyManager = strategyManager;
        this.exchangeManager = exchangeManager;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.exchangePositions = exchangePositions;
        this.exchangeOrders = exchangeOrders;
        this.systemUtil = systemUtil;
    }

    onTick(options = {}) {
        const me = this;

        const items = me.instances.symbols.filter(sym => sym.strategy && sym.strategy.name);

        const strategy = [];

        items.forEach(pair => {
            const str = pair.strategy;

            const strategyInstance = me.strategyManager.findStrategy(str.name);

            if (!strategyInstance) {
                me.logger.error(`Invalid find strategy: ${JSON.stringify(str.name)}`);
                return;
            }

            strategy.push(str);
        });

        switch (items.length) {
            case 2:
                return me.visitTwoPairsStrategy(items, strategy, options);
            default:
                return;
        }
    }

    visitTwoPairsStrategy(items, strategy, options) {
        // items: ArrayOfObjects 

        const me = this;

        const tickers = [];
        const positions = [];
        const orders = [];

        const strategyName = _.head(strategy).name;
        const opt = {
            ...strategy[0].options,
            ...strategy[1].options,
            ...options
        };
        
        items.forEach(pair => {
            const ticker = me.tickers.get(pair.exchange, pair.symbol);
            
            if (!ticker) { //Check is ticker empty
                me.logger.error(`Ticker: <${pair.exchange}>.<${pair.symbol}> not found.`);
                console.log(`Ticker: <${pair.exchange}>.<${pair.symbol}> not found.`);
                return;
            }

            tickers.push(ticker);
            
            //Get positions, if exists, for this pairs
            const position = me.exchangePositions.get(pair.exchange, pair.symbol);
            if (position) positions.push(position);

            //Get order, if exists, for this pairs
            const order = me.exchangeOrders.get(pair.exchange, pair.symbol, ExchangeOrder.STATUS_OPEN);
            if (order) orders.push(order);
        });
        
        //get a signal from stratygy what we must do with pairs | {}
        return this.strategyManager.execute(strategyName, orders, positions, tickers, opt);
    }

    visitOnePairsStrategy() {

    }

    visitMultiplicityPairsStrategy() {

    }
};
