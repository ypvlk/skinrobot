
const ActionEvent = require('../../event/action_event');
const ActionCalculate = require('../actions/action_calculate');

module.exports = class SignalListener {
    constructor(
        exchangeManager,
        eventEmitter,
        logger,
        systemUtil
    ) {
        this.exchangeManager = exchangeManager;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.systemUtil = systemUtil;

    }

    onSignal(signals) {
        const me = this;
        const actions = [];

        signals.forEach(signal => {
            const action = ActionCalculate.calculate(signal);
            actions.push(action);
        });

        if (actions && actions.length > 0) {
            me.eventEmitter.emit('actions', new ActionEvent(actions));
        }
    }
}