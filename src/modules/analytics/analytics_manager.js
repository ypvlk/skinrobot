const _ = require('lodash');


module.exports = class AnalyticsManager {
    constructor(balances, orders, positions, tickers) {
        this.balances = balances;
        this.orders = orders;
        this.positions = positions;
        this.tickers = tickers;

        this.positions_count = 0;
        this.balance = 0;
        this.positions_loss_count = 0;
        this.positions_profit_count = 0;
        this.signals_count = 0;
        this.actions_count = 0;
        this.sended_orders_count = 0;
        this.resended_orders_count = 0;
        this.positions_close_count = 0;

        //макс профит в позиции
        //макс лос в позиции
        //среднее время в позиции
        //макс время в позиции
        //мин время в позиции
        
    }

    init() {

        //тут будет крон который будет сохранять всю дату в базу
        //можно сразу проверить базу а есть ли там за сегодня данные и если есть то продолжать с них

        //как то нужно получить первоначальный баланс
        //

    }
}