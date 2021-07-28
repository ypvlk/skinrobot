const _ = require('lodash');

module.exports = class StrategyDatabaseListener {
    constructor(
        meanReversionRepository,

        backtestingStorage
    ) {
        this.meanReversionRepository = meanReversionRepository;
        this.backtestingStorage = backtestingStorage;
    }

    async saveData(signalEvent) {
        const {
            strategy,
            data
        } = signalEvent;

        if (!data || !strategy) return;

        // if (data && data.backtesting) {
            this.saveTestingData(data);
        // }
        
        // const strategy_repository = this.getRepository(strategy);

        // await strategy_repository.insertData(data);
    }

    getRepository(name) {
        if (name === 'mean_reversion') {
            return this.meanReversionRepository;
        }
        if (name === 'mean_reversion_2') {
            return this.meanReversionRepository;
        }
    }

    saveTestingData(data) {
        if (data.balance) this.backtestingStorage.updateBalance(data.balance);
        if (data.balance_comm) this.backtestingStorage.updateBalanceWithComm(data.balance_comm);
        if (data.drawdown) this.backtestingStorage.updateDrawdown(data.drawdown);
        if (data.all_positions) this.backtestingStorage.updateAllPositions(data.all_positions);
        if (data.positive_positions) this.backtestingStorage.updatePositivePositions(data.positive_positions);
        if (data.negative_positions) this.backtestingStorage.updateNegativePositions(data.negative_positions);

        if (data.max_position_profit) this.backtestingStorage.updateMaxPositionProfit(data.max_position_profit);
        if (data.max_position_lose) this.backtestingStorage.updateMaxPositionLose(data.max_position_lose);
        if (data.min_position_profit) this.backtestingStorage.updateMinPositionProfit(data.min_position_profit);
        if (data.min_position_lose) this.backtestingStorage.updateMinPositionLose(data.min_position_lose);
        if (data.average_position_profit) this.backtestingStorage.updateAveragePositionProfit(data.average_position_profit);
        if (data.average_position_lose) this.backtestingStorage.updateAveragePositionLose(data.average_position_lose);
    }
};
