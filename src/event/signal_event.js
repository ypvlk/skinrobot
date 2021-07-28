module.exports = class SignalEvent {
    constructor(strategy, data, signals) {

        // this.state = state;
        this.strategy = strategy;
        this.data = data;
        this.signals = signals;
        this.incomeAt = new Date();
    }
};