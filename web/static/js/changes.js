'use strict'

$(document).ready(function() {
    //Сскрипт для тега селекс для выбора нескольких значений
    chosePairs();

    //Перехватываем отправку формы
    //Удаляем обновления страницы
    //И отправляем запрос сами
    //Создаем html с данными получеными 
    submitFilterForm();
});

$(function() {
    $('input[name="datepicker"]').daterangepicker({
        opens: 'left',
        autoApply: true,
        // timePicker: true, //add timepicker,
        // timePickerIncrement: 5,
        // minDate: moment.utc(),
        maxDate: moment.utc()
    }, function(start, end, label) {
        // console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
});

$('input[name="datepicker"]').on('apply.daterangepicker', function(ev, picker) {
    console.log('ev', ev);
    console.log('picker', picker);
});

function chosePairs() {
    const chosen_options = {
        no_results_text: "Oops, nothing found!",
        max_selected_options: 10
    }

    $('#pairs').chosen(chosen_options).change(function(e, params){
        const values = $("#pairs").chosen().val();
        // console.log('values: ', values, typeof values);
    });
}

function submitFilterForm() {
    $('#filter-form').on('submit', function(e) {
        e.preventDefault();

        $.ajax({
            url : $(this).attr('action') || window.location.pathname,
            type: "POST",
            data: $(this).serialize(),
            success: function (data) {
                if (data.length) {
                    let trBodyHTML = '';
                    let thHeadHTML = '';
                    const firstTHHeadHTML = '<th class="col-md-1 p-1" style="border-top-width: 1px; size: 1px">Time</th>';

                    $(data).each(function(i, item) {
                        let thHead = '';
                        let firstTDBodyHTML = `<td class="col-md-1 p-1">${timeFormater(item.time)}</td>`;

                        $(item.data).each(function(j, val) {
                            thHead += `<th class="col-md-1 p-1" style="border-top-width: 1px;">${splitSymbol(val.symbol)}</th>`; //font-size: x-small;
                            firstTDBodyHTML += `<td class="col-md-1 p-1"">${val.change}</td>`
                        });
                        
                        thHeadHTML = thHead;
                        trBodyHTML += `<tr class="row">${firstTDBodyHTML}</tr>`;
                    })
                    
                    $('#table-filter-head').html(`<tr class="row">${firstTHHeadHTML}${thHeadHTML}</tr>`);
                    $('#table-filter-body').html(trBodyHTML);  
                } else {
                    $('#table-filter-head').html(`<tr class="row"><td>EMPTY</td></tr>`);
                    $('#table-filter-body').html(''); //<tr class="row"></tr>
                }
            },
            error: function (jXHR, textStatus, errorThrown) {
                // console.log('BLALAL');
                alert(errorThrown);
            }
        });
    });
}

function timeFormater(unixTime) {
    return moment.utc(unixTime * 1000).format('DD/MM, HH:mm'); //'MMM D, YYYY, HH:mmA' "MM/DD/YY"
}

function splitSymbol(symbol) {
    const split = symbol.split('.');
    return `${split[0]}<p class="m-0">${split[1]}</p>`;
}