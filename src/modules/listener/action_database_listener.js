

module.exports = class ActionDatabaseListener {
    constructor(actionRepository) {
        this.actionRepository = actionRepository;
    }


    async insertActions(actionEvent) {
        const {actions, incomeAt} = actionEvent;

        if (actions && actions.length > 0) {
            await this.actionRepository.insertActions(actions, incomeAt);
        }
    }


}