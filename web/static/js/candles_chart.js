'use strict'

function chart() {

    const chartDom = document.getElementById('chart');

    const chartProperties = {
        width: 400,
        height: 300,
        // timeScale:{
        //     timeVisible:true,
        //     secondsVisible:false,
        // }
    }

    const chart = LightweightCharts.createChart(chartDom, chartProperties);
    const lineSeries = chart.addLineSeries();
    lineSeries.setData([
        { time: '2019-04-11', value: 80.01 },
        { time: '2019-04-12', value: 96.63 },
        { time: '2019-04-13', value: 76.64 },
        { time: '2019-04-14', value: 81.89 },
        { time: '2019-04-15', value: 74.43 },
        { time: '2019-04-16', value: 80.01 },
        { time: '2019-04-17', value: 96.63 },
        { time: '2019-04-18', value: 76.64 },
        { time: '2019-04-19', value: 81.89 },
        { time: '2019-04-20', value: 74.43 },
        { time: '2019-04-11', value: 100.01 },
        { time: '2019-04-12', value: 100.63 },
        { time: '2019-04-13', value: 10.64 },
        { time: '2019-04-14', value: 10.89 },
        { time: '2019-04-15', value: 100.43 },
        { time: '2019-04-16', value: 10.01 },
        { time: '2019-04-17', value: 100.63 },
        { time: '2019-04-18', value: 10.64 },
        { time: '2019-04-19', value: 100.89 },
        { time: '2019-04-20', value: 100.43 },
    ]);
}

chart()