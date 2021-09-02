var c = module.exports = {}

c.symbols = [];

// let l = [
//     'LTCUSDT'
// ]

// l.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'LTCUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.2, //% - значения отклонения новой разницы процентов от старой
//                 'exchange_commission': 0.08,
//                 'get_position_change_tier_1': 0.55, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.055, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     50, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000//in mill
//             }
//         }
//     })
// });

//binance_futures
let k = [
    'BTCBUSD' 
]

k.forEach((pair) => {
    c.symbols.push({
        'symbol': pair,
        'periods': ['1m'],
        'exchange': 'binance_futures',
        'state': 'watch',
        'is_test': false,
        'strategy': {
            'name': 'mean_reversion',
            'options': {
                'lead': 'BTCBUSD', //lead - означает что этот стак ведущий
                'correction_indicator_changes': 0.10,
                'exchange_commission': 0.08,
                'get_position_change_tier_1': 0.40, //%
                'get_position_change_tier_2': 0.6, //%
                'get_position_change_tier_3': 0.8, //%
                'stop_lose_position_change': 1.2, //%
                'take_profit_position_change': 0.055, //%
                'hand_delta': 0,
                'tiers': [
                    50, //USDT (Asset)
                    33,
                    33 
                ],
                'ban_trading_time': 30000//in mill
            }
        }
    })
})

let m = [
    'ETHBUSD'
]

m.forEach((pair) => {
    c.symbols.push({
        'symbol': pair,
        'periods': ['1m'],
        'exchange': 'binance_futures',
        'is_test': false,
        'watch': {},
        'trade': {},
        'strategy': {
            'name': 'mean_reversion',
            'options': {
                'driven': 'ETHBUSD', //driven - это означает что это ведомый стак
                'correction_indicator_changes': 0.10, //% - значения отклонения новой разницы процентов от старой
                'exchange_commission': 0.08,
                'get_position_change_tier_1': 0.40, //%
                'get_position_change_tier_2': 0.6, //%
                'get_position_change_tier_3': 0.8, //%
                'stop_lose_position_change': 1.2, //%
                'take_profit_position_change': 0.055, //%
                'hand_delta': 0,
                'tiers': [
                    50, //USDT (Asset)
                    33,
                    33 
                ],
                'ban_trading_time': 30000,//in mill
                
            }
        }
    })
});

// let n = [
//     'BTCUSDT'
// ]

// n.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'is_test': false,
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'lead': 'BTCUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.2, //% - значения отклонения новой разницы процентов от старой
//                 'exchange_commission': 0.08,
//                 'get_position_change_tier_1': 0.55, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.055, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     50, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000,//in mill
                
//             }
//         }
//     })
// });

// let p = [
//     'ETHUSDT'
// ]

// p.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'is_test': false,
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'ETHUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.20, //% - значения отклонения новой разницы процентов от старой
//                 'exchange_commission': 0.04,
//                 'get_position_change_tier_1': 0.10, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.05, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     33, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000,//in mill
                
//             }
//         }
//     })
// });

// let n = [
//     'BCHUSDT'
// ]

// n.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'LTCUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.060, //% - значения отклонения новой разницы процентов от старой
// 'exchange_commission': 0.04,
//                 'get_position_change_tier_1': 0.34, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.05, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     33, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000//in mill
//             }
//         }
//     })
// });

// let x = [
//     'DENTUSDT'
// ]

// x.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'is_test': false,
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'ETHUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.20, //% - значения отклонения новой разницы процентов от старой
// 'exchange_commission': 0.04,
//                 'get_position_change_tier_1': 0.10, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.05, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     33, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000,//in mill
                
//             }
//         }
//     })
// });

// let y = [
//     'HOTUSDT'
// ]

// y.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'is_test': false,
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'HOTUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.20, //% - значения отклонения новой разницы процентов от старой
//                 'exchange_commission': 0.04,
//                 'get_position_change_tier_1': 0.10, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.05, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     33, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000,//in mill
                
//             }
//         }
//     })
// });

// let z = [
//     'BTTUSDT'
// ]

// z.forEach((pair) => {
//     c.symbols.push({
//         'symbol': pair,
//         'periods': ['1m'],
//         'exchange': 'binance_futures',
//         'is_test': false,
//         'watch': {},
//         'trade': {},
//         'strategy': {
//             'name': 'mean_reversion',
//             'options': {
//                 'driven': 'BTTUSDT', //driven - это означает что это ведомый стак
//                 'correction_indicator_changes': 0.20, //% - значения отклонения новой разницы процентов от старой
//                 'exchange_commission': 0.04,
//                 'get_position_change_tier_1': 0.10, //%
//                 'get_position_change_tier_2': 0.6, //%
//                 'get_position_change_tier_3': 0.8, //%
//                 'stop_lose_position_change': 1.2, //%
//                 'take_profit_position_change': 0.05, //%
//                 'hand_delta': 0,
//                 'tiers': [
//                     33, //USDT (Asset)
//                     33,
//                     33 
//                 ],
//                 'ban_trading_time': 30000,//in mill
                
//             }
//         }
//     })
// });


//Инфа по amount и по тирам
//Короче BTC можно взять минимум на 0.001 amount
//Это на 33 доллара по курсу 33000 дол
//Для другого стака выставляешь сумму такую же 33 доллара
//Получаеться что чтобы взять по одной позиции и это минимальная сумма
//То это ровно 33 + 33 = 66 долларов. + на риски. 
//Также каждый след тир должен быть минимум 33 дол по текущему курсу битка
//Если беру плече, то там не все так однозначно, снимает доп сумму на обеспечения как я понимаю 
