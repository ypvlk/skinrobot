
const Action = require('../../dict/action');

module.exports = class ActionListener {
    constructor(
        eventEmitter,
        logger,
        exchangeManager,
        orders,
        positions,
        systemUtil,
        throttler
    ) {
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.exchangeManager = exchangeManager;
        this.orders = orders;
        this.positions = positions;
        this.systemUtil = systemUtil;
        this.throttler = throttler;
    }

    async onActions(actions) {
        const promises = [];

        //В зависимости от типа акшена я должен вызвать соответсвующий метод в бирже
        actions.forEach(action => {
            const fn = this.executeAction(action);

            if (fn instanceof Function) {
                promises.push(fn());
            }
        });

        await this.executePromises(promises);
    }

    executeAction(action) {
        const exchange = this.exchangeManager.get(action.getExchangeName());
        if (!exchange) {
            this.logger.error(`ExecuteAction: Invalid exchange: ${action.getExchangeName()}`);
            console.error(`ExecuteAction: Invalid exchange: ${action.getExchangeName()}`);
            return;
        }

        switch (action.getType()) {
            case Action.TYPE_TRADE:
                return () => this.onTrade(exchange, action.getOrder());
            case Action.TYPE_CANCEL_ONE:
                return () => this.onCancelOne(exchange, action.getSymbol());
            case Action.TYPE_CLOSE_ONE:
                return () => this.onCloseOne(exchange, action.getPosition());
            case Action.TYPE_CANCEL_ALL:
                return () => this.onCancelAll(exchange);
            case Action.TYPE_CLOSE_ALL:
                return () => this.onCloseAll(exchange);
            default:
                this.logger.error(`ExecuteAction: invalid action type: ${action.getType()}`);
                console.log(`ExecuteAction: invalid action type: ${action.getType()}`);
                return;
        }
    }

    async onTrade(exchange, order) { //Cоздаем ордер в buy или в sell
        console.log('Send <on trade> order...');

        return exchange.order(order);
    }
    
    async onCloseOne(exchange, position) { //Закрываем позиции одного стака
        console.log('Send <on close one>...');

        return exchange.closeOnePosition(position);
    }

    async onTerminate() { //Отменяем все ордера и закрываем позиции всех стаков на всех биржах
        //TODO add orders
        console.log('Terminate all orders and positions...');

        const me = this;
        const promises = []; 

        //Get orders and positions from storage if exsists
        const positions = me.positions.all(); //
        
        for (let p in positions) {
            //p - object position
            const exchangeName = positions[p].getExchange();
            const exchange = me.exchangeManager.get(exchangeName);

            if (!exchange) {
                this.logger.error(`On Terminate: Invalid exchange name: ${exchangeName}`);
                console.log(`On Terminate: Invalid exchange name: ${exchangeName}`);
                break;
            }
            
            promises.push(exchange.closeOnePosition(positions[p])); //TODO
        }

        if (promises && promises.length > 0) {
            await me.executePromises(promises);
        }
    }

    onCancelAll(exchangeName, symbol) { //Отменяем все ордера всех стаков на одной бирже

    }

    onCloseAll(exchangeName) { //Закрываем все позиции всех стаков на одной бирже
        //Похожий с терминате

    }

    async executePromises(promises, retry = 0) {
        let result;

        if (promises && promises.length === 0 ) return undefined;

        if (retry > this.systemUtil.getConfig('settings.order.retry', 4)) {
            this.logger.error(`Retry (${retry}) reached limit`);
            return undefined;
        }

        if (retry > 0) this.logger.info(`Retry (${retry}) sending actions`);
        
        try {
            result = await Promise.allSettled(promises); //allSettled
        } catch(e) {
            this.logger.error(`On run promise allSettled error: ${e}`);
        }

        const me = this;

        if (result && result.length) {
            let new_promises = [];

            result.forEach((p, index) => {
                if (p.status === 'rejected') {
                    new_promises.push(promises[index]);
                    
                    //Retry rejected promises
                    me.throttler.addTask('action_listener_execute_promise', async () => {
                        await me.executePromises(new_promises, ++retry);
                    }, me.systemUtil.getConfig('settings.retry_ms', 1000));
                }
            });
        }

    }
}