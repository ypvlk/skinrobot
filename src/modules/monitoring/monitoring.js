

module.exports = class MonitoringService {
    constructor(
        balancesStorage,
        ordersStorage,
        positionsStorage,
        tickersStorage

    ) {
        this.balancesStorage = balancesStorage;
        this.ordersStorage = ordersStorage;
        this.positionsStorage = positionsStorage;
        this.tickersStorage = tickersStorage;


        this.drawdown = 0;
        this.all_positions = 0;
        this.positive_positions = 0;
        this.negative_positions = 0;



        // this.max_position_profit = 0;
        // this.max_position_lose = 0;
        // this.min_position_profit = 0;
        // this.min_position_lose = 0;
        // this.average_position_profit = 0;
        // this.average_position_lose = 0;
    }

    all() {
        return {
            balances: this.balancesStorage.all(),
            orders: this.ordersStorage.all(),
            positions: this.positionsStorage.all(),
            tickers: this.tickersStorage.all(),

        }
    }

}