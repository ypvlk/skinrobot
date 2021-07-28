
module.exports = class BacktestingStorage {
    constructor() {
        this.balance = 0;
        this.balance_with_comm = 0;
        this.drawdown = 0;
        this.all_positions = 0;
        this.positive_positions = 0;
        this.negative_positions = 0;

        this.max_position_profit = 0;
        this.max_position_lose = 0;
        this.min_position_profit = 0;
        this.min_position_lose = 0;
        this.average_position_profit = 0;
        this.average_position_lose = 0;
    }

    getAveragePositionLose() {
        return this.average_position_lose;
    }

    updateAveragePositionLose(lose) {
        if (this.average_position_lose !== lose) {
            this.average_position_lose = lose;
        }
    }

    getAveragePositionProfit() {
        return this.average_position_profit;
    }

    updateAveragePositionProfit(profit) {
        if (this.average_position_profit !== profit) {
            this.average_position_profit = profit;
        }
    }

    getMinPositionLose() {
        return this.min_position_lose;
    }

    updateMinPositionLose(lose) {
        if (this.min_position_lose !== lose) {
            this.min_position_lose = lose;
        }
    }

    getMinPositionProfit() {
        return this.min_position_profit;
    }

    updateMinPositionProfit(profit) {
        if (this.min_position_profit !== profit) {
            this.min_position_profit = profit;
        }
    }

    getMaxPositionLose() {
        return this.max_position_lose;
    }

    updateMaxPositionLose(lose) {
        if (this.max_position_lose !== lose) {
            this.max_position_lose = lose;
        }
    }

    getMaxPositionProfit() {
        return this.max_position_profit;
    }

    updateMaxPositionProfit(profit) {
        if (this.max_position_profit !== profit) {
            this.max_position_profit = profit;
        }
    }

    getBalance() {
        return this.balance;
    }

    updateBalance(balance) {
        if (this.balance !== balance) {
            this.balance = balance;
        }
    }

    getBalanceWithComm() {
        return this.balance_with_comm;
    }

    updateBalanceWithComm(balance) {
        if (this.balance_with_comm !== balance) {
            this.balance_with_comm = balance;
        }
    }

    getDrawdown() {
        return this.drawdown;
    }

    updateDrawdown(drawdown) {
        if (this.drawdown !== drawdown) {
            this.drawdown = drawdown;
        }
    }

    getAllPositions() {
        return this.all_positions;
    }

    updateAllPositions(count) {
        if (this.all_positions !== count) {
            this.all_positions = count;
        }
    }

    getPositivePositions() {
        return this.positive_positions;
    }

    updatePositivePositions(count) {
        if (this.positive_positions !== count) {
            this.positive_positions = count;
        }
    }

    getNegativePositions() {
        return this.negative_positions;
    }

    updateNegativePositions(count) {
        if (this.negative_positions !== count) {
            this.negative_positions = count;
        }
    }

    all() {
        return {
            balance: this.balance,
            balance_with_comm: this.balance_with_comm,
            drawdown: this.drawdown,
            all_positions: this.all_positions,
            positive_positions: this.positive_positions,
            negative_positions: this.negative_positions
        }
    }
};
