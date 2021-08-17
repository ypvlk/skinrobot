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