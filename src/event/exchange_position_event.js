module.exports = class ExchangePositionEvent {
    static get ACTION_SAVE() {
        return 'SAVE';
    }

    static get ACTION_DELETE() {
        return 'DELETE';
    }

    constructor(exchange, symbol, action, position) {

        if (![ExchangePositionEvent.ACTION_SAVE, ExchangePositionEvent.ACTION_DELETE].includes(action)) {
            throw new Error(`Invalid exchange position event action: ${action}`);
        }

        this.exchange = exchange;
        this.symbol = symbol;
        this.action = action;
        this.position = position;
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

    getPosition() {
        return this.position;
    }
};