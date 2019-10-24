$(function () {
    $(document).ready(function () {
        $("#contractLink").text(function () {
            $("#contractLink").text(shortenHex($(this).text(), 16))
        })

        $("#slider").slider({
            animate: true,
            value: 0.01,
            min: 0.01,
            max: 10,
            step: 0.01,
            slide: function (event, ui) {
                update(1, ui.value); //changed
            }
        })

        //Added, set initial value.
        $("#amount").val(0)
        $("#duration").val(0)
        $("#amount-label").text(0)
        $("#duration-label").text(0)
        update()
    })

    $('#numSelector a').on('click', function () {
        var sel = $(this).data('title')
        var tog = $(this).data('toggle')
        $('#' + tog).prop('value', sel)

        $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive')
        $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active')
    })

})

//changed. now with parameter
function update(slider, val) {
    //changed. Now, directly take value from ui.value. if not set (initial, will use current value.)
    var $amount = slider == 1 ? val : $("#amount").val();
    var $duration = slider == 2 ? val : $("#duration").val();
    var maxCase = $("#maxCase").val();

    /* commented
    $amount = $( "#slider" ).slider( "value" );
    $duration = $( "#slider2" ).slider( "value" );
     */

    $total = "$" + ($amount * $duration);
    $("#amount").val($amount);
    $("#amount-label").text($amount);
    $("#deposit-label").text($amount * maxCase);
    $("#duration").val($duration);
    $("#duration-label").text($duration);
    $("#total").val($total);
    $("#total-label").text($total);

    $('#slider a').html('<label><span class="glyphicon glyphicon-chevron-left"></span> ' + $amount + ' <span class="glyphicon glyphicon-chevron-right"></span></label>');
}

/** fancybox popup event */
function popup(tableIndex) {
    $("#modalTableIndex").val(tableIndex)
    $(".modalTableIndex").text(tableIndex)
    const tableData = JSON.parse($("#table-data-" + tableIndex).text())

    if ($("#table-pending-" + tableIndex).val() == "true") {
        popupDisplay('pending')
        // ajax
        $.ajax({
            url: '/api/gameTables/' + tableIndex,
            type: 'get',
            dataType: 'json',
            success: function (table) {
                now = Math.ceil(new Date().getTime() / 1000)
                waiting = 45
                if (table.recentTime < table.pendingTime &&
                    table.pendingTime + waiting > now) {
                    // pending situation
                    $("#bet-recentTx").text(shortenHex(table.pendingTx, 12))
                        .attr("href", 'https://ropsten.etherscan.io/tx/' + table.pendingTx)
                        .attr("target", "_blank")
                } else {
                    // is not pending anymore
                    alert('Pending Transaction assumed Reverted. If not, Please Notify us.')
                    $("#table-data-" + table._id).text(JSON.stringify(table))
                    changeStatusView(table.status, table._id)
                    $.fancybox.close()
                }
            }
        })
    } else {
        popupDisplay(tableData.status)

        if (tableData.status == 'full') {
            $("#timer").val(parseInt($("#timer").val()) + 1)
    
            $("#bet-maker-full").text(shortenHex(tableData.maker, 12))
            .attr("href", 'https://ropsten.etherscan.io/address/' + tableData.maker)
            .attr("target","_blank")
            $("#bet-taker-full").text(shortenHex(tableData.taker, 12))
            .attr("href", 'https://ropsten.etherscan.io/address/' + tableData.taker)
            .attr("target","_blank")
            $("#bet-stake-full").text(toEth(tableData.deposit / $("#maxCase").val()))
            $("#bet-taker-number").text(tableData.guessedNum)
    
            var now = Math.ceil(new Date().getTime() / 1000)
            const finishTime = tableData.takingTime + (tableData.allowedTime)
            if (finishTime <= now) {
                $("#bet-time-left").text('Times Up')
            } else {
                var duration = finishTime - now
                startTimer(parseInt($("#timer").val()), duration, $("#bet-time-left"));
            }
        } else if (tableData.status == 'half') {
            $("#bet-maker-half").text(shortenHex(tableData.maker, 12))
            .attr("href", 'https://ropsten.etherscan.io/address/' + tableData.maker)
            .attr("target","_blank")
            $("#bet-stake-half").text(toEth(tableData.deposit / $("#maxCase").val()))
        } else {
    
        }
    }

}

function popupDisplay(status) {
    const statusArray = ['full', 'half', 'pending', 'empty']
    for (let index = 0; index < statusArray.length; index++) {
        if($(".popup-" + statusArray[index]).css("display") != "none"){   
            $(".popup-" + statusArray[index]).css("display", "none");   
        }  
    }

    $(".popup-" + status).css("display", "block");   
}

function toEth(wei) {
    return wei / Math.pow(10, 18);
}

function shortenHex(data, length) {
    const halfLen = (length - 2) / 2
    const reverse = data.length - halfLen
    var shorteneData = data.substring(0, halfLen + 2) + '....' + data.substring(reverse, data.length)
    return shorteneData
}

function startTimer(timerId, duration, display) {
    var timer = duration, minutes, seconds;
    var countDown = setInterval(function () {
        currentId = parseInt($("#timer").val())
        if (currentId != timerId || --timer < 0) {
            clearInterval(countDown);
            display.text('Times Up')
        }
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.text(minutes + " minutes " + seconds + " seconds Left")
      
    }, 1000);
}