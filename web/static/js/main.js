'use strict'

$(document).ready(function() {
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
