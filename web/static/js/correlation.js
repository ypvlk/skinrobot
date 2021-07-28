'use strict'

$(document).ready(function() {
    //Сскрипт для тега селекс для выбора нескольких значений
    chosePairs();

    //Перехватываем отправку формы
    //Удаляем обновления страницы
    //И отправляем запрос сами
    //Создаем html с данными получеными 
    submitFilterForm((pairsChanges) => {
        //Подключаем вебсокеты
        webSocketConnect(pairsChanges);
    });
});

function chosePairs() {
    const chosen_options = {
        no_results_text: "Oops, nothing found!",
        max_selected_options: 2
    }

    $('#pairs').chosen(chosen_options).change(function(e, params){
        const values = $("#pairs").chosen().val();
    });
};

function webSocketConnect(pairsChanges) {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
        ws.send(JSON.stringify({ event: "correlation", payload: { one: 'ONE', two: 'TWO' }}));
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
            onWebSocketMessage(data, pairsChanges);
            // console.log('data', data);
        }
        // ws.send(JSON.stringify({ event: "correlation", payload: { one: 'ONE', two: 'TWO' }}));
    }
};

function submitFilterForm(cb) {
    $('#filter-form').on('submit', function(e) {
        e.preventDefault();

        $.ajax({
            url : $(this).attr('action') || window.location.pathname,
            type: "POST",
            data: $(this).serialize(),
            success: function (res) {
                if (res) {
                    cb(res);
                }
            },
            error: function (jXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });
}

function onWebSocketMessage(data, pairsChanges) {
    let changesTableBody = '';
    let changesTableTD = '';
    let changesTableDifferenceRow = '';
    let differencaData = [];
    
    $.each(pairsChanges, function(key, value) {
        //Этим перебором я создаю 2 строки таблицы
        changesTableTD += `<td scope="col">${key}</td>`;
        let changesArray = [];
        
        $.each(value, function(i, item) {
            const change = Math.floor((((data[key].askPrice - item.close) / item.close) * 100) * 100) / 100; //    Math.floor(((data[key].askPrice - item.close) / item.close) * 100);
            //Создаем обьект массивов для отображение разницы между этими процентами
            changesArray.push(change);
            // differencaData[key].push(change);
            changesTableTD += `<td scope="col">${change}%</td>`;
        });

        differencaData.push(changesArray);

        changesTableBody += `<tr>${changesTableTD}</tr>`;
        changesTableTD = '';
    });
    
    changesTableDifferenceRow += `<td csope="col">Difference</td>`;
    
    for (let i = 0; i < 5; i++) {
        changesTableDifferenceRow += `<td csope="col">${
            Math.floor((differencaData[0][i] - differencaData[1][i]) * 100) / 100 > 0 ? Math.floor((differencaData[0][i] - differencaData[1][i]) * 100) / 100 : Math.floor((differencaData[0][i] - differencaData[1][i]) * 100) / 100 * -1
        }%</td>`;
    }

    changesTableBody += `<tr>${changesTableDifferenceRow}</tr>`;

    $('#table-changes-body').html(changesTableBody);
}
