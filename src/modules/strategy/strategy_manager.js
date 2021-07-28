const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const SignalEvent = require('../../event/signal_event');
const Signal = require('../../dict/signal');

module.exports = class StrategyManager {
    constructor(
        eventEmitter,
        logger, 
        projectDir
    ) {
        this.eventEmitter = eventEmitter;
        this.projectDir = projectDir;
        this.logger = logger;

        this.strategies = undefined;
    }

    init() {

        if (typeof this.strategies !== 'undefined') {
            return this.strategies;
        }

        const strategies = [];

        const dirs = [`${__dirname}/strategies`];

        const recursiveReadDirSyncWithDirectoryOnly = (p, a = []) => {
            if (fs.statSync(p).isDirectory()) {
                fs.readdirSync(p)
                    .filter(f => !f.startsWith('.') && fs.statSync(path.join(p, f)).isDirectory())
                    .map(f => recursiveReadDirSyncWithDirectoryOnly(a[a.push(path.join(p, f)) - 1], a));
            }

            return a;
        };

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                return;
            }
            
            fs.readdirSync(dir).forEach(file => {
                if (file.endsWith('.js')) {
                    strategies.push(new (require(`${dir}/${file.substr(0, file.length - 3)}`))());
                }
            });

            // Allow strategies to be wrapped by any folder depth:
            // "foo/bar" => "foo/bar/bar.js"
            recursiveReadDirSyncWithDirectoryOnly(dir).forEach(folder => {
                const filename = `${folder}/${path.basename(folder)}.js`;

                if (fs.existsSync(filename)) {
                    strategies.push(new (require(filename))());
                }
            });
        });

        return (this.strategies = strategies);
    }

    execute(strategyName, orders, positions, tickers, options) {
        
        const strategy = this.findStrategy(strategyName);
        let strategyResult;
        
        try {
            strategyResult = strategy.execute(orders, positions, tickers, options);
        } catch(e) {
            this.logger.error(`Strategy <${strategyName}> error: ${String(e)}`);
            return;
        }

        if (!strategyResult) return;
        
        this.eventEmitter.emit('tick_signal', 
            new SignalEvent(
                strategyResult.strategy,
                strategyResult.data,
                (strategyResult.signals.map(signal => {
                    return new Signal(
                        signal.exchange,
                        signal.symbol,
                        signal.side,
                        signal.size,
                        signal.price,
                        signal.orderType,
                        signal.amount,
                        signal.orderID,
                        signal.action
                    )
                }))
            )
        );
    }

    findStrategy(strategyName) {
        return this.init().find(strategy => strategy.getName() === strategyName);
    }

    getStrategyNames() {
        return this.init().map(strategy => strategy.getName());
    }
};
