$(function () {
    $(document).ready(function () {
        $("#contractLink").text(function () {
            $("#contractLink").text(shortenAddress($(this).text()))
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

    $('#radioBtn a').on('click', function () {
        var sel = $(this).data('title')
        var tog = $(this).data('toggle')
        $('#' + tog).prop('value', sel)

        $('a[data-toggle="' + tog + '"]').not('[data-title="' + sel + '"]').removeClass('active').addClass('notActive')
        $('a[data-toggle="' + tog + '"][data-title="' + sel + '"]').removeClass('notActive').addClass('active')
    })

})

function tableSetting(tableIndex) {
    $("#modalTableIndex").text(tableIndex)
}

function shortenAddress(addr) {
    var shortenedAddr = addr.substring(0, 6) + '....' + addr.substring(-4, 4)
    return shortenedAddr
}

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
    $('#slider2 a').html('<label><span class="glyphicon glyphicon-chevron-left"></span> ' + $duration + ' <span class="glyphicon glyphicon-chevron-right"></span></label>');
}