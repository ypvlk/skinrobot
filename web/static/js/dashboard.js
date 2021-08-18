'use strict'

$(document).ready(function() {
    
    $('#positions_close_all').click(function(){
        console.log('this', this);
        
        handlePositionsCloseAll(this.positions);
    });
});

function handlePositionsCloseAll(positions) {
    $('#trade_pause_btn').click(function(e){
        e.preventDefault();
        
        const url = 'http://localhost:3000' + '/positions/close-all';
        const method = 'POST';
        
        $.ajax({
            url : url +query,
            type: method,
            data: $(positions).serialize(),
            success: function (res) {
                return;
            },
            error: function (jXHR, textStatus, errorThrown) {
                alert(errorThrown);
            }
        });
    });
};
