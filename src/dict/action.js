module.exports = class Action {
    static get TYPE_TRADE() {
        return 'trade';
    }

    static get TYPE_TERMINATE() {
        return 'terminate';
    }

    static get TYPE_CANCEL_ONE() {
        return 'cancelOne';
    }

    static get TYPE_CLOSE_ONE() {
        return 'closeOne';
    }

    static get TYPE_CANCEL_ALL() {
        return 'cancelAll';
    }

    static get TYPE_CLOSE_ALL() {
        return 'closeAll';
    }

    constructor(exchangeName, symbol, type, order, position) {
        if (
            ![
                Action.TYPE_TRADE,
                Action.TYPE_TERMINATE,
                Action.TYPE_CANCEL_ONE,
                Action.TYPE_CLOSE_ONE,
                Action.TYPE_CANCEL_ALL,
                Action.TYPE_CLOSE_ALL
            ].includes(type)
        ) {
            throw new Error(`Invalid action type: ${type}`);
        }

        this.exchangeName = exchangeName;
        this.symbol = symbol;
        this.type = type;
        this.order = order;
        this.position = position;
    }

    // static createSellBuyAction(exchangeName, symbol, order) {
    //     return new Action(
    //         exchangeName,
    //         symbol,
    //         Action.TYPE_TRADE,
    //         order
    //     )
    // }

    // static createTerminateAction() {
    //     return new Action(
    //         undefined,
    //         undefined,
    //         Action.TYPE_TERMINATE,
    //         undefined,
    //         undefined
    //     )
    // }

    // static createCloseOneAction(exchangeName, symbol, position) {
    //     return new Action(
    //         exchangeName,
    //         symbol,
    //         Action.TYPE_CLOSE_ONE,
    //         undefined,
    //         position
    //     )
    // }

    getPosition() {
        return this.position;
    }

    getType() {
        return this.type;
    }

    getExchangeName() {
        return this.exchangeName;
    }

    getSymbol() {
        return this.symbol;
    }

    getOrder() {
        return this.order || undefined;
    }
};