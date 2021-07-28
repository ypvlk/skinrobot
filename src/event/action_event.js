module.exports = class ActionEvent {
    constructor(actions) {
        this.actions = actions;
        this.incomeAt = new Date() / 1;
    }

    getActions() {
        return this.actions && this.actions.length;
    }
};