module.exports = class ExchangeOrderEvent {
    static get ACTION_SAVE() {
        return 'SAVE';
    }

    static get ACTION_DELETE() {
        return 'DELETE';
    }


    constructor(exchange, symbol, action, order) {

        if (![
            ExchangeOrderEvent.ACTION_SAVE, 
            ExchangeOrderEvent.ACTION_DELETE
        ].includes(action)) {
            throw new Error(`Invalid exchange order event action: ${action}`);
        }

        this.exchange = exchange;
        this.symbol = symbol;
        this.action = action;
        this.order = order;
    }

    getExchange() {
        return this.exchange;
    }

    getSymbol() {
        return this.symbol;
    }

    getAction() {
        return this.action;
    }

    getOrder() {
        return this.order;
    }
};