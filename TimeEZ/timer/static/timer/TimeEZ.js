/**
 * Created by andrewribeiro on 5/3/16.
 */

var timerCounting = false;
var countingInterval = null;
var startTime = null;

var currentTimeSessionID = 0;
var timeSessionActive = false;
var currentTimeSessionObj = null;

var duration = 0;
var preState = true;
var storageFunction = null;

// Elements are time structures.
var timeStorageState = [];

window.onbeforeunload = function(){
   if(!currentTimeSessionObj.isEmpty()) {
        timeStorageState.push(currentTimeSessionObj);
        storageFunction();
   }
}

// timeSessionName = null if this isn't a time session.
function TimeStructure (timeSessionName) {

    this.sessionName = timeSessionName;

    this.timeEntries = [];

    this.addEntry = function (startDate,endDate,duration) {
        this.timeEntries.push(new TimeEntry(startDate,endDate,duration));
    };

    this.getEntries = function () {
        return this.timeEntries;
    };

    this.isEmpty = function () {
        return this.timeEntries.length == 0;
    }



    this.makeStringifyObj = function(){
        return new TimeStructureStringify();
    }
}

function constructFromSeralized(obj)
{
    ts = new TimeStructure(obj.sessionName);

    // Turn the date objects back to Date().
    ts.timeEntries = obj.timeEntries;

    obj.timeEntries.forEach(function (timeEntry) {

        timeEntry.startTime = new Date(timeEntry.startTime);
        timeEntry.endDate = new Date(timeEntry.endDate);
    });

    return ts;
}


// Serlizable
function TimeEntry(startDate,endDate,duration) {

    this.startTime = startDate;
    this.endDate = endDate;
    this.duration = duration
}

$(document).ready(function() {

    //============= LOCAL STORAGE ==================
    if(typeof(Storage) !== "undefined") {
        // We have local storage.
        // Load prior storage state if available.

        localDatJSON = localStorage.getItem("timeStorageState");

        if( localDatJSON != null && localDatJSON != 'null')
        {
            // We have some local data to load.
            timeStorageState = JSON.parse(localStorage.getItem("timeStorageState"));

            //Populate the time log based upon the loaded state.
            populateTimeLog( timeStorageState, "#timeLog" );
        }

        // Local storage is enabled. Add the storage function.
        // Call this to set the timeStorageState to our current state.
        storageFunction = function () {
            localStorage.setItem("timeStorageState",JSON.stringify(timeStorageState));
        }

    } else {
        // We don't have any local storage.
        storageFunction = function(ar1,ar2){
            
            alert("Could not store local data.");
        }
        
        alert("You poor sap. We don't support your old browser. Consider joining us in the future.");
    }
    //===========================================================

    // Enable the popver plugin. Bootsrap 3.
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
            </div>';


            if(timeSessionActive){

                currentTimeSessionObj.addEntry(startTime,endTime,durationString);

                $("#ts"+currentTimeSessionID)
                    .find(".timeSessionLog").prepend(entry);

            }else{
                $(entry).prependTo("#timeLog");
                ts = new TimeStructure(null);
                ts.addEntry(startTime,endTime,durationString);
                timeStorageState.push(ts);
                storageFunction();
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

        ts = createTimeSessionLogHTML(currentTimeSessionID,sessionName);


        $("#newSession").popover('hide');

        // Put the name of the time session and session area in the time log.
        $(ts).prependTo("#timeLog");

        // Change button to end time session.
        $("#newSession").removeClass("btn-primary");
        $("#newSession").addClass("btn-warning");
        $("#newSession").html("End Time Session");

        $("#newSession").popover('disable');

        timeSessionActive = true;

        currentTimeSessionObj = new TimeStructure(sessionName);


    });

    $(document).on('click', "#newSession", function() {

        //Time session is active. End it.
        if(timeSessionActive) {
            $("#newSession").removeClass("btn-warning");
            $("#newSession").addClass("btn-primary");
            $("#newSession").html("New Time Session");

            $("#newSession").popover('enable');

            if(currentTimeSessionObj.isEmpty()) {
                // We are ending the time session, but have no times in it. Delete the session.
                $("#ts" + currentTimeSessionID).fadeOut(500);
            }else{
                timeStorageState.push(currentTimeSessionObj);
                storageFunction();
            }

            timeSessionActive = false;


        }
    });

    
    
    //************ END EVENT HANDLERS ***********************//

});


function displayNewTime(timeEntry, parentID){

    var startTime      = timeEntry.startTime;
    var endTime        = timeEntry.endDate;
    var durationString = timeEntry.duration;

    var dateStr = padDigits(startTime.getMonth(),2)+"/"+padDigits(startTime.getDay(),2)+"/"+padDigits(startTime.getFullYear(),2)+" | "
            +padDigits(startTime.getHours(),2)+":"+padDigits(startTime.getMinutes(),2)+":"+padDigits(startTime.getSeconds(),2) +" - "
             +padDigits(endTime.getHours(),2)+":"+padDigits(endTime.getMinutes(),2)+":"+padDigits(endTime.getSeconds(),2);

    var entry = '<div class="timeEntry">\
    <div class="timeEntryTime">'+dateStr+'</div>\
    <div class="timeEntryDuration">'+durationString+'</div>\
    </div>';

    $(entry).prependTo(parentID);


}

function populateTimeLog(state,timeLogID){


    state.forEach(function (timeState) {

        console.log(timeState);
        if(timeState.sessionName == null){
            // Restore objects from serlized state.
            timeState = constructFromSeralized(constructFromSeralized(timeState));

            // We are not dealing with a time sesssion.

            entry = timeState.getEntries()[0];
            displayNewTime(entry,timeLogID);
        }
        else{
            // Dealing with a time session.
            timeState = constructFromSeralized(constructFromSeralized(timeState));
            entryies = timeState.getEntries();


            ts = createTimeSessionLogHTML(currentTimeSessionID,timeState.sessionName);

            $(ts).prependTo("#timeLog");



            entryies.forEach(function (entry) {
                  displayNewTime(entry,$("#ts"+currentTimeSessionID).find(".timeSessionLog"));
            });

            console.log($("#ts"+currentTimeSessionID));



            currentTimeSessionID++;
            //displayNewTime(entry,timeLogID);
        }


    });

}


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

function createTimeSessionLogHTML(currentTimeSesID,sessionName) {
    var ts = '<div class="timeSession" id="ts'+currentTimeSesID+'">';
        ts += '<div class="sessionName">'+sessionName+'</div>';
        ts += '<div class="timeSessionLog"></div>';
        ts += "</div>";

    return ts;
}

/* padDigits(number, digits)
 * Pads number to the left by '0' n digits.
 */
function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}
