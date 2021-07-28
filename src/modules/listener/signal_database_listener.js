const _ = require('lodash');

module.exports = class SignalDatabaseListener {
    constructor(signalRepository) {
        this.signalRepository = signalRepository;
    }

    async saveSignal(signalEvent) {
        const { 
            strategy,
            signals 
        } = signalEvent;

        await this.signalRepository.insertSignals(signals, strategy);
    }
};
