/**
 * Created by andrewribeiro on 5/3/16.
 */

var timerCounting = false;
var countingInterval = null;
var startTime = null;
var currentTimeSessionID = 0;
var timeSessionActive = false;
var duration = 0;
var preState = true;

$(document).ready(function() {
            
    $("[data-toggle=popover]").popover();
    
    //************ EVENT HANDLERS ***********************//
    $("#actionButton").click(function () {
        if(timerCounting)
        {
            endTime = new Date();

            clearInterval(countingInterval);

            $("#actionButton").removeClass("btn-danger");
            $("#actionButton").addClass("btn-success");
            $("#actionButton").html("Start");


            durationString = $("#timerOutput").val();

            var dateStr = padDigits(startTime.getMonth(),2)+"/"+padDigits(startTime.getDay(),2)+"/"+padDigits(startTime.getFullYear(),2)+" | "
                +padDigits(startTime.getHours(),2)+":"+padDigits(startTime.getMinutes(),2)+":"+padDigits(startTime.getSeconds(),2) +" - "
                 +padDigits(endTime.getHours(),2)+":"+padDigits(endTime.getMinutes(),2)+":"+padDigits(endTime.getSeconds(),2);


            var entry = '<div class="timeEntry">\
            <div class="timeEntryTime">'+dateStr+'</div>\
            <div class="timeEntryDuration">'+durationString+'</div>\
            </div>'


            if(timeSessionActive){

                $("#ts"+currentTimeSessionID).append(entry);

            }else{
                $(entry).prependTo("#timeLog");
            }


            $("#timerOutput").val("00:00:00");
            duration = 0;
            preState = true;
            timerCounting = false;

        }
        else
        {
            $("#actionButton").removeClass("btn-success");
            $("#actionButton").addClass("btn-danger");
            $("#actionButton").html("Stop");


            countingInterval = setInterval(ticker, 200);

            startTime = new Date();

            timerCounting = true;

            $("#defaultTimeLogMessage").fadeOut(1000);

        }

    });

    $(document).on('click', "#createSessionName", function() {

        currentTimeSessionID++;

        sessionName = $("#sessionNameIn").val();

        if(sessionName == null || sessionName.length < 1)
        {
            sessionName = "Unamed Session";
        }


        var ts = '<div class="timeSession" id="ts'+currentTimeSessionID+'">';
        ts += '<div class="sessionName">'+sessionName+'</div>';
        ts += "</div>";

        $("#newSession").popover('hide');

        $(ts).prependTo("#timeLog");

        $("#newSession").removeClass("btn-primary");
        $("#newSession").addClass("btn-warning");
        $("#newSession").html("End Time Session");

        $("#newSession").popover('disable');

        timeSessionActive = true;
    });

    
    
    //************ END EVENT HANDLERS ***********************//

});


/* ticker()
 * Des: Called by setInterval at a period of 200 ms. This function is responsible for updating the timer
 * output and keeping track of the durration of our current timer.
 * Global Modifies: #timerOutput,preState, duration
 */
function ticker()
{

    var seconds;

    var secondsPadding = ""
    var minutesPadding = ""
    var hoursPadding = ""

    var dt = new Date();

    var secondsOffset = startTime.getSeconds();


    if( dt.getSeconds() >= secondsOffset)
    {
        seconds = dt.getSeconds() - secondsOffset;
    }
    else
    {
        seconds = (60-secondsOffset) + dt.getSeconds();
    }

    if(seconds==59)
    {
        preState = false;
    }
    if( !preState && seconds == 0)
    {
        duration += 60;
        preState = true;
    }

    var minutes = Math.floor(duration / 60);
    var hours   = Math.floor(duration / (60 * 60));


    if(seconds < 10 )
    {
        secondsPadding = "0";
    }

    if(minutes < 10)
    {
        minutesPadding = "0";
    }

    if(hours<10)
    {
        hoursPadding = "0"
    }


    $("#timerOutput").val(hoursPadding+hours+":"+minutesPadding+minutes+":"+secondsPadding+seconds);
}

/* padDigits(number, digits)
 * Pads number to the left by '0' n digits.
 */
function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}
