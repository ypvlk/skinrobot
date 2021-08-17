'use strict'

$(document).ready(function() {


    //Подключаем вебсокеты
    webSocketConnect();

    $('#trade_pause_btn').click(function(e){
        e.preventDefault();
        
        const url = 'http://localhost:3000/trade/pause';
        const method = 'GET';
        const turn = this.value === 'on' ? 'off' : 'on';
        const query = `?turn=${turn}`;
        
        $.ajax({
            url : url +query,
            type: method,
            // data: $(body).serialize(),
            success: function (res) {
                return;
            },
            error: function (jXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });
});

function webSocketConnect() {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
        // ws.send(JSON.stringify({ event: "correlation", payload: { one: 'ONE', two: 'TWO' }}));
    }

    ws.onclose = (event) => {
        if (event.wasClean) {
            alert(`Connection closed cleanly. Code: ${event.code} Reason: ${event.reason}`);
        } else {
            alert(`Lost connection. Code: ${event.code} Reason: ${event.reason}`); // например, "убит" процесс сервера
        }
    }

    ws.onerror = (error) => {
        alert("WebSocket error: " + error.message);
    };

    ws.onmessage = res => {
        if (res.data) {
            const data = JSON.parse(res.data);
            
            if (data && data.indicators) {
                onIndicatorsMessage(data.indicators);
            }
            
            if (data && data.trades) {
                onTradesMessage(data.trades);
            }
            
        }
        // ws.send(JSON.stringify({ event: "correlation", payload: { one: 'ONE', two: 'TWO' }}));
    }
};

function onIndicatorsMessage(indicators) {
    //indicators: Object

    const {
        http_status, 
        ws_status, 
        trade_status
    } = indicators;

    $('#http_status').each(function() {
        $(this).css({ color: http_status ? 'green' : 'red' });
    });

    $('#ws_status').each(function() {
        $(this).css({ color: ws_status ? 'green' : 'red' });
    });

    $('#trade_status').each(function() {
        $(this).css({ color: trade_status ? 'green' : 'red' });
    })

    $('#trade_pause_btn').each(function() {
        $(this).prop('value', trade_status ? 'on' : 'off');
    });
}

function onTradesMessage(trades) {
    //trades: Object

    const {
        positions, 
        orders,
        pairs
    } = trades;

    //<-----Pairs----->//
    let pairs_li = '';
    
    $.each(pairs, function(key, value) {
        // <li class="pair-item"><a href="#">binance_future.BTCBUSD/binance_future.ETHBUSD</a></li>
        pairs_li += `<li class="pair-item"><a href="">${value.exchange}.${value.symbol}</a></li>`;
    });

    $('#pairs_list_ul').html(pairs_li);
    //<-----Pairs End----->//

    //<-----Positions----->//
    let positions_table_body = '';
    
    $.each(positions, function(i, value) {
        let td = '';
        td += `<td>${value.symbol}</td>`;
        td += `<td>${value.amount}</td>`;
        td += `<td>${value.profit}</td>`;
        td += `<td>${value.price}</td>`;
        td += `<td>${value.update_at}</td>`;
        td += `<td>${value.side}</td>`;

        positions_table_body += `<tr>${td}</tr>`;
    });

    $('#table-positions-body').html(positions_table_body);
    //<-----Positions End----->//

    //<-----Orders----->//
    let orders_table_body = '';
    
    $.each(orders, function(i, value) {
        let td = '';
        td += `<td>${value.symbol}</td>`;
        td += `<td>${value.amount}</td>`;
        td += `<td>${value.profit}</td>`;
        td += `<td>${value.price}</td>`;
        td += `<td>${value.update_at}</td>`;
        td += `<td>${value.side}</td>`;

        orders_table_body += `<tr>${td}</tr>`;
    });

    $('#table-orders-body').html(orders_table_body);
    //<-----Orders End----->//
}