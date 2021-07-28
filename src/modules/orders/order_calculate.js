
const Order = require('../../dict/order');
const OrderCapital = require('../orders/order_capital');

module.exports = class OrderCalculate {

    static calculate(symbol, orderType, side, size, price, options) {
        switch (orderType) {
            case Order.TYPE_MARKET:
                return OrderCalculate.createMarketOrder(symbol, side, size, price);
            case Order.TYPE_LIMIT:
                return OrderCalculate.createLimitOrder(symbol, side, size, price);
            default:
                throw new Error(`Invalid order type: ${orderType}`);
        }
    }

    static createMarketOrder(symbol, side, size, price) {
        if (![Order.SIDE_SHORT, Order.SIDE_LONG].includes(side)) {
            throw new Error(`Invalid order side:${side} - ${JSON.stringify([symbol, side, size, price])}`);
        }

        const amount = OrderCapital.calculateAmount(side, size, price);

        return new Order(
            symbol,
            Order.TYPE_MARKET,
            side,
            amount,
            side === Order.SIDE_LONG ? 0.000001 : -0.000001, // fake prices
        );
    }

    static createLimitOrder(symbol, side, size, price) {
        if (![Order.SIDE_SHORT, Order.SIDE_LONG].includes(side)) {
            throw new Error(`Invalid order side:${side} - ${JSON.stringify([symbol, side, size, price])}`);
        }

        const amount = OrderCapital.calculateAmount(side, size, price);

        return new Order(
            symbol,
            Order.TYPE_LIMIT,
            side,
            amount,
            price
        );
    }

    // static createStopOrder(symbol, side, price, amount, options) {
    //     if (![Order.SIDE_SHORT, Order.SIDE_LONG].includes(side)) {
    //     throw new Error(`Invalid order side:${side} - ${JSON.stringify([symbol, side, price, amount, options])}`);
    //     }

    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     symbol,
    //     side,
    //     price,
    //     amount,
    //     Order.TYPE_STOP,
    //     options
    //     );
    // }

    // static createLimitPostOnlyOrderAutoSide(symbol, price, amount, options) {
    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     symbol,
    //     price < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG,
    //     price,
    //     amount,
    //     Order.TYPE_LIMIT,
    //     _.merge(options, {
    //         post_only: true
    //     })
    //     );
    // }

    // static createCloseLimitPostOnlyReduceOrder(symbol, price, amount) {
    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     symbol,
    //     price < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG,
    //     price,
    //     amount,
    //     this.TYPE_LIMIT,
    //     {
    //         post_only: true,
    //         close: true
    //     }
    //     );
    // }

    // static createLimitPostOnlyOrderAutoAdjustedPriceOrder(symbol, amount, options = {}) {
    //     return Order.createLimitPostOnlyOrder(
    //     symbol,
    //     amount < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG,
    //     undefined,
    //     amount,
    //     _.merge(options, {
    //         adjust_price: true
    //     })
    //     );
    // }

    // static createRetryOrder(order, amount) {
    //     if (!(order instanceof Order)) {
    //     throw new Error('TypeError: no Order');
    //     }

    //     if (![Order.SIDE_SHORT, Order.SIDE_LONG].includes(order.side)) {
    //     throw new Error(`Invalid order side:${order.side} - ${JSON.stringify(order)}`);
    //     }

    //     let orderAmount = order.amount;
    //     if (typeof amount !== 'undefined') {
    //     orderAmount = Math.abs(amount);

    //     if (order.side === Order.SIDE_SHORT) {
    //         orderAmount *= -1;
    //     }
    //     }

    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     order.symbol,
    //     order.side,
    //     order.price,
    //     orderAmount,
    //     order.type,
    //     order.options
    //     );
    // }

    // static createRetryOrderWithPriceAdjustment(order, price) {
    //     if (!(order instanceof Order)) {
    //         throw new Error('TypeError: no Order');
    //     }

    //     if (![Order.SIDE_SHORT, Order.SIDE_LONG].includes(order.side)) {
    //         throw new Error(`Invalid order side:${order.side} - ${JSON.stringify(order)}`);
    //     }

    //     return new Order(
    //         Math.round(new Date().getTime().toString() * Math.random()),
    //         order.symbol,
    //         order.side,
    //         price,
    //         order.amount,
    //         order.type,
    //         order.options
    //     );
    // }

    // static createPriceUpdateOrder(id, price, side) {
    //     return new Order(id, undefined, side, price, undefined, undefined, undefined);
    // }

    // static createStopLossOrder(symbol, price, amount) {
    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     symbol,
    //     price < 0 || amount < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG,
    //     price,
    //     amount,
    //     'stop',
    //     { close: true }
    //     );
    // }

    // static createUpdateOrder(id, price = undefined, amount = undefined) {
    //     return new Order(id, undefined, price < 0 || amount < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG, price, amount);
    // }

    // static createCloseOrderWithPriceAdjustment(symbol, amount) {
    //     return Order.createLimitPostOnlyOrderAutoAdjustedPriceOrder(symbol, amount, { close: true });
    // }

    // static createUpdateOrderOnCurrent(exchangeOrder, price = undefined, amount = undefined) {
    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     exchangeOrder.symbol,
    //     exchangeOrder.getLongOrShortSide(),
    //     typeof price === 'undefined' ? exchangeOrder.price : price,
    //     typeof amount === 'undefined' ? exchangeOrder.amount : amount,
    //     exchangeOrder.type,
    //     exchangeOrder.options
    //     );
    // }

    // static createTrailingStopLossOrder(symbol, distance, amount) {
    //     return new Order(
    //     Math.round(new Date().getTime().toString() * Math.random()),
    //     symbol,
    //     distance < 0 ? Order.SIDE_SHORT : Order.SIDE_LONG,
    //     distance,
    //     amount,
    //     this.TYPE_TRAILING_STOP,
    //     { close: true }
    //     );
    // }

}