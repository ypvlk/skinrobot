'use strict'

$(document).ready(function() {


    //Подключаем вебсокеты
    webSocketConnect();

    $('#trade_pause_btn').click(function(e){
        e.preventDefault();
        
        handleClickTradePause(this.value, function() {
            //Callback
        });
    });
});

function handleClickTradePause(value, cb) {
    const url = 'http://localhost:3000/trade/pause';
    const method = 'GET';
    const turn = value === 'on' ? 'off' : 'on';
    const query = `?turn=${turn}`;
    
    $.ajax({
        url : url +query,
        type: method,
        // data: $(body).serialize(),
        success: function (res) {
            return cb();
        },
        error: function (jXHR, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}

function webSocketConnect() {
    const ws = new WebSocket('ws://206.189.96.37:3001');

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

            if (data && data.summary) {
                onSummaryMessage(data.summary);
            }

            if (data && data.log) {
                onLogMessage(data.log);
            }
            
        }
        // ws.send(JSON.stringify({ event: "correlation", payload: { one: 'ONE', two: 'TWO' }}));
    }
};

//Handle message on ws
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

//Handle message on ws
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
        $(this).css({ color: trade_status ? 'red' : 'green' });
    })

    $('#trade_pause_btn').each(function() {
        $(this).prop('value', trade_status ? 'on' : 'off');
    });
}

function onSummaryMessage(data) {
    const {
        balance,
        balance_with_comm,
        max_drawdown,
        all_positions,
        all_orders,
        positive_positions,
        negative_positions
    } = data;

    let summary_table_left = '';
    let summary_table_right = '';

    let tr_balance = `<tr><td>Balance</td><td>${balance}</td></tr>`;
    let tr_balance_with_comm = `<tr><td>Balance with comm</td><td>${balance_with_comm}</td></tr>`;
    let tr_max_drawdown = `<tr><td>Drawdown</td><td>${max_drawdown}</td></tr>`;
    let tr_all_positions = `<tr><td>All positions</td><td>${all_positions}</td></tr>`;
    let tr_all_orders = `<tr><td>All orders</td><td>${all_orders}</td></tr>`;
    let tr_positive_positions = `<tr><td>Positive positions</td><td>${positive_positions}</td></tr>`;
    let tr_negative_positions = `<tr><td>Negative positions</td><td>${negative_positions}</td></tr>`;
    
    summary_table_left += tr_balance + tr_balance_with_comm + tr_max_drawdown;
    summary_table_right += tr_all_positions + tr_all_orders + tr_positive_positions + tr_negative_positions;

    $('#summary_table_left').html(summary_table_left);
    $('#summary_table_right').html(summary_table_right);
}

function onLogMessage(log) {
    const {
        uuid,
        level,
        message,
        created_at,
    } = log;

    const p = `<p>id: ${uuid} level: ${level} message: ${message} created_at: ${created_at}</p>`;

    $('#logs_body').append(p);
}