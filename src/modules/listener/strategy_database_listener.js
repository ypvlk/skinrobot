const _ = require('lodash');

module.exports = class StrategyDatabaseListener {
    constructor(
        meanReversionRepository,
        backtestingMonitoringService
    ) {
        this.meanReversionRepository = meanReversionRepository;
        this.backtestingMonitoringService = backtestingMonitoringService;
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
        if (data.balance) this.backtestingMonitoringService.updateBalance(data.balance);
        if (data.balance_comm) this.backtestingMonitoringService.updateBalanceWithComm(data.balance_comm);
        if (data.drawdown) this.backtestingMonitoringService.updateDrawdown(data.drawdown);
        if (data.all_positions) this.backtestingMonitoringService.updateAllPositions(data.all_positions);
        if (data.positive_positions) this.backtestingMonitoringService.updatePositivePositions(data.positive_positions);
        if (data.negative_positions) this.backtestingMonitoringService.updateNegativePositions(data.negative_positions);

        if (data.max_position_profit) this.backtestingMonitoringService.updateMaxPositionProfit(data.max_position_profit);
        if (data.max_position_lose) this.backtestingMonitoringService.updateMaxPositionLose(data.max_position_lose);
        if (data.min_position_profit) this.backtestingMonitoringService.updateMinPositionProfit(data.min_position_profit);
        if (data.min_position_lose) this.backtestingMonitoringService.updateMinPositionLose(data.min_position_lose);
        if (data.average_position_profit) this.backtestingMonitoringService.updateAveragePositionProfit(data.average_position_profit);
        if (data.average_position_lose) this.backtestingMonitoringService.updateAveragePositionLose(data.average_position_lose);
    }
};
