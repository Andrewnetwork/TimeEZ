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
// Null elements are left in place to keep the ordering of the elements.
// Nulls are removed when saving the data.
var timeStorageState = [];

// Saves current time session state.
// Called when the window is closing.
window.onbeforeunload = function(){
   if(timeStorageState.length > 0 && timerCounting) {

       // For single times.
       endTime = new Date();
       durationString = $("#timerOutput").val();

       ts = new TimeStructure(null);
       ts.addEntry(startTime,endTime,durationString);
       alert(ts);
       timeStorageState.push(ts);
   }

    // Prevent the storage of empty states.
    if(timeStorageState[timeStorageState.length-1].sessionName != null &&
        timeStorageState[timeStorageState.length-1].getEntries().length <= 0)
    {
        delete timeStorageState[timeStorageState.length-1];
    }

    storageFunction();
}

// timeSessionName = null if this isn't a time session.
function TimeStructure (timeSessionName) {

    this.sessionName = timeSessionName;

    this.timeEntries = [];

    this.addEntry = function (startDate,endDate,duration) {
        var ne = new TimeEntry(startDate,endDate,duration);
        this.timeEntries.push(ne);
        return ne;
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


// Serlizable
function TimeEntry(startDate,endDate,duration) {

    this.startTime = startDate;
    this.endDate = endDate;
    this.duration = duration
}

$(document).ready(function() {

    // Enable the popver plugin. Bootsrap 3.
    $("[data-toggle=popover]").popover();

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

            if(timeStorageState.length > 0){
                hideStartText();
            }
        }

        // Local storage is enabled. Add the storage function.
        // Call this to set the timeStorageState to our current state.
        storageFunction = function () {
            //Let's remove null entries by building a new list.
            noNullState = [];
            timeStorageState.forEach(function (entry) {
                if(entry != null){
                    noNullState.push(entry)
                }

            });

            localStorage.setItem("timeStorageState",JSON.stringify(noNullState));
        }

    } else {
        // We don't have any local storage.
        storageFunction = function(){
            alert("Could not store local data.");
        }
        
        alert("You poor sap. We don't support your old browser. Consider joining us in the future.");
    }
    //===========================================================

    
    //************ EVENT HANDLERS ***********************//

    //Click start or stop.
    $("#actionButton").click(function () {
        if(timerCounting)
        {
            endTime = new Date();

            clearInterval(countingInterval);

            $("#actionButton").removeClass("btn-danger");
            $("#actionButton").addClass("btn-success");
            $("#actionButton").html("Start");


            durationString = $("#timerOutput").val();

            if(timeSessionActive){

                var ne = currentTimeSessionObj.addEntry(startTime,endTime,durationString);

                displayNewTime(ne,$("#ts"+currentTimeSessionID )
                    .find(".timeSessionLog"),currentTimeSessionID ,false,false);

            }else{
                ts = new TimeStructure(null);
                ts.addEntry(startTime,endTime,durationString);
                timeStorageState.push(ts);

                displayNewTime(ts.getEntries()[0], "#timeLog", timeStorageState.length-1,true, true);

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

            hideStartText();
        }

    });

    // Button in popover window for creating a nammed session.
    sesFun = function() {

        sessionName = $("#sessionNameIn").val();

        if(sessionName == null || sessionName.length < 1)
        {
            sessionName = "Unamed Session";
        }

        currentTimeSessionObj = new TimeStructure(sessionName);
        timeStorageState.push(currentTimeSessionObj);

        ts = createTimeSessionLogHTML(timeStorageState.length-1,sessionName);



        $("#newSession").popover('hide');

        // Put the name of the time session and session area in the time log.
        $(ts).prependTo("#timeLog").addClass("active");

        // Change button to end time session.
        $("#newSession").removeClass("btn-primary");
        $("#newSession").addClass("btn-warning");
        $("#newSession").html("End Time Session");

        $("#newSession").popover('disable');

        timeSessionActive = true;

        currentTimeSessionID  = timeStorageState.length - 1;

    };

    $(document).on('click', "#createSessionName", sesFun);
    $(window).on('keypress', function(e){
        //TODO: There may be a bug here .
        if($("#sessionNameIn").val()!=null && e.keyCode == 13)
        {
            sesFun();
        }


    } );

    // Click the bottom End Session or New Time Session button.
    $(document).on('click', "#newSession", function() {

        //Time session is active. End it.
        if(timeSessionActive) {
            $("#newSession").removeClass("btn-warning");
            $("#newSession").addClass("btn-primary");
            $("#newSession").html("New Time Session");

            $("#newSession").popover('enable');

            // The last element in the timeStorageState is the current one.
            $("#ts" + (timeStorageState.length-1)).removeClass("active");

            if(currentTimeSessionObj.isEmpty()) {
                // We are ending the time session, but have no times in it. Delete the session.
                $("#ts" + (timeStorageState.length-1)).fadeOut(500);
            }else{
                storageFunction();
            }

            timeSessionActive = false;


        }
    });

    //************ END EVENT HANDLERS ***********************//

});

function openModal(stateID){
    // The stateID is the index at which the object is found in the timeStorageState
    obj = timeStorageState[stateID];
    
    if(obj.sessionName == null){
        // Single Time, not a session.
        $("#deleteTime").unbind("click");
        $("#deleteTime").click(function () {
         
            delete timeStorageState[stateID];
            storageFunction();
            $("#te"+stateID).remove();
            // Hide active modal.
            $('.modal.in').modal("hide");
        });

    }else{
        // A session.
        $("#deleteSession").unbind("click");
        $("#deleteSession").click(function () {
         
            delete timeStorageState[stateID];
            storageFunction();
            $("#ts"+stateID).remove();

            // Hide active modal.
            $('.modal.in').modal("hide");
            
            
        });

        $("#makeActiveSession").unbind("click");
        $("#makeActiveSession").click(function () {

            currentTimeSessionObj = timeStorageState[stateID];
            timeSessionActive = true;
            currentTimeSessionID = stateID;

            $("#ts"+stateID).addClass("active");

            // Hide active modal.
            $('.modal.in').modal("hide");

        });
        
        $("#sessionTitle").html(timeStorageState[stateID].sessionName);
    }
    
}

function displayNewTime(timeEntry, parentID, stateID,includeDateStr, isSingluar){

    var startTime      = timeEntry.startTime;
    var endTime        = timeEntry.endDate;
    var durationString = timeEntry.duration;
    var timeLabel        = '<button type="button" class="btn btn-success btn-xs">Create Label</button>';

    if(includeDateStr) {
        timeLabel  = padDigits(startTime.getMonth(), 2) + "/" + padDigits(startTime.getDay(), 2) + "/" + padDigits(startTime.getFullYear(), 2) + " | "
            + padDigits(startTime.getHours(), 2) + ":" + padDigits(startTime.getMinutes(), 2) + ":" + padDigits(startTime.getSeconds(), 2) + " - "
            + padDigits(endTime.getHours(), 2) + ":" + padDigits(endTime.getMinutes(), 2) + ":" + padDigits(endTime.getSeconds(), 2);
    }
    // Only include a modal on an indivudal time entry, otherwise the session modal will
    // be triggered upon clicking individual times in a session.
    var modalStr ='<div class="timeEntry" id="te'+stateID+'">';
    if(isSingluar){
        modalStr = '<div data-toggle="modal" draggable="true" id="te'+stateID+'" onclick="openModal('+stateID+')" data-target="#singeTimeModal" class="timeEntry">';
    }

    var entry = modalStr+ '<div class="timeEntryTime">'+timeLabel+'</div>\
    <div class="timeEntryDuration">'+durationString+'</div>\
    </div>';

    $(entry).prependTo(parentID);


}

function populateTimeLog(state,timeLogID){

    stateCounter = 0;

    state.forEach(function (timeState) {
        if(timeState != null) {
            if (timeState.sessionName == null) {
                // Restore objects from serlized state.
                timeState = constructFromSeralized(timeState);

                // We are not dealing with a time sesssion.

                entry = timeState.getEntries()[0];
                displayNewTime(entry, timeLogID, stateCounter,true, true);
            }
            else {
                // Dealing with a time session.

                timeStorageState[stateCounter] = constructFromSeralized(timeState);
                timeState                      = timeStorageState[stateCounter];
                entryies = timeState.getEntries();


                ts = createTimeSessionLogHTML(stateCounter, timeState.sessionName);

                $(ts).prependTo("#timeLog");

                entryies.forEach(function (entry) {
                    displayNewTime(entry, $("#ts" + stateCounter).find(".timeSessionLog"), stateCounter,false, false);
                });

                currentTimeSessionID  = timeStorageState.length - 1;
            }

            stateCounter++
        }

    });

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

function createTimeSessionLogHTML(currentTimeSesID,sessionName) {
    var ts = '<div ondrop="drop(event)" ondragover="allowDrop(event)" onclick="openModal('+currentTimeSesID+')" class="timeSession" data-toggle="modal" data-target="#sessionModal" id="ts'+currentTimeSesID+'">';
        ts += '<div class="sessionName">'+sessionName+'</div>';
        ts += '<div class="timeSessionLog"></div>';
        ts += "</div>";

    return ts;
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

/* padDigits(number, digits)
 * Pads number to the left by '0' n digits.
 */
function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

function hideStartText() {

    $("#defaultTimeLogMessage").fadeOut(1000);

}


//Drag and drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("id");
    console.log($(ev.target).parent());
    $(ev.target).parent().append("JJ");
}