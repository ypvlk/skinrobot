$(function() {
    const options = {
        reverse: false
    };
    

    $('#reverse').click(function() {
        options.reverse = $('#reverse').prop('checked');
        buildChart(options);
        return
    });

    buildChart(options);
});

function buildChart(options) {
    const chart = $('.chart');
    
    if (chart.length > 0) {
        const tickers = chart.data('tickers');
        console.log('tickers', tickers);

        let first_pair_data = [];
        let second_pair_data = [];

        if (tickers) {
            first_pair_data = tickers.first_pair_data;
            second_pair_data = tickers.second_pair_data;
        }

        am4core.ready(function() {
            /**
             * data = [
             *  { date: new Date, open: , close: close }
             * ];
            */
            // Themes begin
            am4core.useTheme(am4themes_animated);
            // Themes end
            
            const chart = am4core.create("chart", am4charts.XYChart);
            chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
            
            let data = [];
            
            // var bid = 100;
            // var ask = 250;
            
            // for (var i = 1; i < 4; i++) {
            //     bid += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 4);
            //     ask = Math.round(bid + Math.random() * 5 + i / 5 - (Math.random() < 0.5 ? 1 : -1) * Math.random() * 2);
            //     data.push({ date: new Date(2018, 0, i), bid: bid, ask: ask });
            // }

            if (!reverse) {
                for(let i = 0; i < first_pair_data.length; i++) {
                    const obj = {
                        date: new Date(first_pair_data[i].time).getUTCMilliseconds(),
                        bid: first_pair_data[i].bid,
                        ask: second_pair_data[i].ask
                    };
                    data.push(obj);
                }
            } else {
                for(let i = 0; i < second_pair_data.length; i++) {
                    const obj = {
                        date: new Date(second_pair_data[i].time).getUTCMilliseconds(),
                        bid: second_pair_data[i].bid,
                        ask: first_pair_data[i].ask
                    };
                    data.push(obj);
                }
            }
            //Нужно перебрать два массива и создать с них один массив с обьектами в нем где будут биды и аски
            //Нужн опоставить условие в зависимости от чексбокса что куда ставить
            //вынести в переменные название полей
            
            // const data1 = candles.map(function(c) {
            //     return {
            //         date: c.date,
            //         open: c.open,
            //         close: c.close
            //     }
            // })
            // console.log('tickers', tickers);
            console.log('data', data);
            chart.data = data;
            
            const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            
            const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.tooltip.disabled = true;
            
            const series = chart.series.push(new am4charts.LineSeries());
            series.dataFields.dateX = "date";
            series.dataFields.openValueY = "bid";
            series.dataFields.valueY = "ask";
            series.tooltipText = "bid: {openValueY.value} ask: {valueY.value}";
            series.sequencedInterpolation = true;
            series.fillOpacity = 0.3;
            series.defaultState.transitionDuration = 1000;
            series.tensionX = 0.8;
            
            const series2 = chart.series.push(new am4charts.LineSeries());
            series2.dataFields.dateX = "date";
            series2.dataFields.valueY = "bid";
            series2.sequencedInterpolation = true;
            series2.defaultState.transitionDuration = 1500;
            series2.stroke = chart.colors.getIndex(6);
            series2.tensionX = 0.8;
            
            chart.cursor = new am4charts.XYCursor();
            chart.cursor.xAxis = dateAxis;
            chart.scrollbarX = new am4core.Scrollbar();
            
            }); // end am4core.ready()
    }
}