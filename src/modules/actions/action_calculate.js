
const Action = require('../../dict/action');
const OrderCalculate = require('../orders/order_calculate');

module.exports = class ActionCalculate {

    static calculate(signal) {
        switch (signal.getAction()) {
            case Action.TYPE_TRADE:
                return ActionCalculate.createTradeAction(signal);
            case Action.TYPE_CANCEL_ONE:
                return ActionCalculate.createCancelOneAction(signal.getExchange(), signal.getSymbol());
            case Action.TYPE_CLOSE_ONE:
                return ActionCalculate.createCloseOneAction(signal);
            default:
                throw new Error(`Invalid signal action: ${signal.getAction()}`);
        }
    }

    static createTradeAction(signal) {
        const order = OrderCalculate.calculate(
            signal.getSymbol(),
            signal.getOrderType(),
            signal.getSide(),
            signal.getSize(),
            signal.getPrice()
        );

        return new Action(
            signal.getExchange(),
            signal.getSymbol(),
            Action.TYPE_TRADE,
            order
        )
    }

    // static createCancelOneAction(exchange, symbol) {
    //     return new Action(
    //         exchange,
    //         symbol,
    //         Action.TYPE_CANCEL_ONE,
    //         undefined
    //     )
    // }

    static createTerminateAction() {
        return new Action(
            undefined,
            undefined,
            Action.TYPE_TERMINATE,
            undefined
        )
    }

    static createCloseOneAction(signal) {
        const position = {
            symbol: signal.getSymbol(),
            side: signal.getSide(),
            amount: signal.getAmount()
        }

        return new Action(
            signal.getExchange(),
            signal.getSymbol(),
            Action.TYPE_CLOSE_ONE,
            undefined,
            position
        )
    }
}