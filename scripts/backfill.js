'use strict'

const fs = require("fs");
const path = require('path');
const fetch = require("node-fetch");

const binanceFuturesFetchUrl = `https://fapi.binance.com/fapi/v1/exchangeInfo`;

(async () => {
    const days_count_days = 100; //количество дней за которые смотрим данные
    const days_count_candles = 100; //количество всего свечей для периода 1d
    const days_count_min = 1//3;
    const min_count_candles = 2//500; //количество всего свечей для периода 5m

    const pariods = ['1d']//['1d', '5m'];
    const data = {
        binance: [],
        binance_futures: []
    }

    const fetchData = await fetch(binanceFuturesFetchUrl)
        .then(res => res.json())
        .catch(err => console.log(err));
    
    data.binance_futures = fetchData.symbols
        .map(item => item.symbol)
        .filter(symbol => symbol.indexOf('_') === -1)

    for (let key in data) {
        if(data.hasOwnProperty(key)){
            const pairs = data[key];
            pairs.forEach(pair => {
                pariods.forEach(period => {
                    let str = '';
                    if (period === '1d') str = `-e ${key} -s ${pair} -p ${period} -d ${days_count_days} -c ${days_count_candles}\n`;
                    // if (period === '5m') str = `-e ${key} -s ${pair} -p ${period} -d ${days_count_min} -c ${min_count_candles}\n`;
                    // commands.push(str);
                    try{
                        fs.appendFileSync(path.join(__dirname, "../scripts/backfill.data"), str, "utf8");
                    } catch (e) {
                        console.log(e);
                    }
                });
            });
        }
    }
})();