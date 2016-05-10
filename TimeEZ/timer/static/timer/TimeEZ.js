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

// For the global function to be defined when the document is loaded so that it may assign events to it.
var openModal = null;

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
    this.isExpanded = false;

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
    this.duration = duration;
    this.timeLabel = "";
    this.viewReferences = [];

    // Render this function for it's view
    this.render = function(view){
        switch(view){
            case "TimeLog":
                this.timeLogRender();
        }
    };

    this.addViewRef = function (view,reference) {

        this.viewReferences[view] = reference;
    }

    this.setLabel = function (lbl) {
        this.timeLabel = lbl;
    }
    this.getLabel = function () {
        return this.timeLabel
    }

    // Rendering functions
    this.timeLogRender = function () {
        var timeLabel  = this.timeLabel;

        if(this.timeLabel.length == 0)
        {
            timeLabel  = '<button type="button" class="btn btn-success btn-xs">Create Label</button>'
        }

        this.viewReferences["TimeLog"].find(".timeEntryLabel").html(timeLabel);
    };

    this.removeView = function (view) {
        if(view == "TimeLog")
        {
            this.viewReferences[view].fadeOut(300);
        }
    }

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
        };
        
        alert("You poor sap. We don't support your old browser. Consider joining us in the future.");
    }
    //===========================================================

    
    //************ EVENT HANDLERS ***********************//

    //Click start or stop.
    $("#actionButton").click(function () {
        if(timerCounting)
        {
            // End Time.
            endTime = new Date();

            clearInterval(countingInterval);

            $("#actionButton").removeClass("btn-danger");
            $("#actionButton").addClass("btn-success");
            $("#actionButton").html("Start");


            durationString = $("#timerOutput").val();

            if(timeSessionActive){

                var ne = currentTimeSessionObj.addEntry(startTime,endTime,durationString);

                timeRef = displayNewTime(ne,$("#ts"+currentTimeSessionID )
                    .find(".timeSessionLog"),currentTimeSessionID ,false,false,currentTimeSessionObj.getEntries().length-1);

                //TODO: re-enable when we have the expansion logic sorted out.
                // Expand the current session upon adding to it.
                //ne.addViewRef("TimeLog",timeRef);

             }else{
                ts = new TimeStructure(null);
                ts.addEntry(startTime,endTime,durationString);
                timeStorageState.push(ts);

                displayNewTime(ts.getEntries()[0], "#timeLog", timeStorageState.length-1,true, true,0);

                storageFunction();
            }


            $("#timerOutput").val("00:00:00");
            duration = 0;
            preState = true;
            timerCounting = false;

        }
        else
        {
            //Start time.

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
        makeSessionBttnEndSession();

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

            makeSessionBttnStartSession();
            
            $("#ts" + currentTimeSessionID).removeClass("active");

            if(currentTimeSessionObj.isEmpty()) {
                // We are ending the time session, but have no times in it. Delete the session.
                $("#ts" + (timeStorageState.length-1)).fadeOut(500);
            }else{
                storageFunction();
            }

            timeSessionActive = false;


        }
    });

    openModal = function (stateID){
        // The stateID is the index at which the object is found in the timeStorageState
        obj = timeStorageState[stateID];

        if(obj.sessionName == null){
            // Single Time, not a session.
            $("#singeTimeModal").modal();

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
            $("#sessionModal").modal();

            $("#deleteSession").unbind("click");
            $("#deleteSession").click(function () {

                delete timeStorageState[stateID];
                storageFunction();
                $("#ts"+stateID).remove();

                //console.log(stateID);
                //console.log(currentTimeSessionID);

                if(stateID == currentTimeSessionID)
                {
                    // We are deleting the current time session.
                    makeSessionBttnStartSession();
                }

                // Hide active modal.
                $('.modal.in').modal("hide");


            });

            $("#makeActiveSession").unbind("click");
            $("#makeActiveSession").click(function () {

                currentTimeSessionObj = timeStorageState[stateID];
                timeSessionActive = true;
                currentTimeSessionID = stateID;

                $("#ts"+stateID).addClass("active");


                $("#ts"+stateID).prependTo("#timeLog");



                // Hide active modal.
                $('.modal.in').modal("hide");

                makeSessionBttnEndSession();

            });

            //Populate Modal for New Session

            $("#sessionTitle").val(timeStorageState[stateID].sessionName);
            $("#sessionModalBody").html("");

            var entries = timeStorageState[stateID].getEntries();


            var formCounter = 0;
            entries.forEach( function ( entry ) {

                var entryLabel = entry.getLabel();
                var id = ''+stateID+formCounter;
                var entryHTML =
                    '<div class="form-group" id="fg'+id+'" >' +
                        '<span class="label label-info col-sm-3 timeLabelModal">Time Label</span>' +
                        '<div class="timeLabelModalEntry">' +
                            '<input id="fc'+id+'" type="text" class="form-control" value="'+entryLabel+'">' +
                        '</div>'+
                        '<div class="timeShowModal">'+entry.duration+'</div>'+
                        '<div class="deleteTimeModal"><button type="button" class="btn btn-danger" >Delete Time</button></div>'+
                    '</div>';

                $("#sessionModalBody").prepend(entryHTML);

                var tc = formCounter
                $("#fg"+id).find(".btn").click(function () {
                    $("#fg"+id).fadeOut(300);
                    console.log(formCounter);
                    timeStorageState[stateID].timeEntries[tc].removeView("TimeLog");
                    delete timeStorageState[stateID].timeEntries[tc];
                });

                //console.log(entry);
                $(document).on('keyup','#fc'+stateID+formCounter, function (e) {

                    formInput = $(e.currentTarget).val();

                    if(formInput != null  ){
                        entry.timeLabel = formInput;
                        entry.render("TimeLog");
                    }

                });

                formCounter++;
            });




        }

    }


    //************ END EVENT HANDLERS ***********************//

});

// Change button to end time session.
function makeSessionBttnEndSession() {

    $("#newSession").removeClass("btn-primary");
    $("#newSession").addClass("btn-warning");
    $("#newSession").html("End Time Session");

    $("#newSession").popover('disable');
}

function makeSessionBttnStartSession() {
    $("#newSession").removeClass("btn-warning");
    $("#newSession").addClass("btn-primary");
    $("#newSession").html("New Time Session");

    $("#newSession").popover('enable');
}


function displayNewTime(timeEntry, parentID, stateID,includeDateStr, isSingluar,idPostFix){

    var startTime      = timeEntry.startTime;
    var endTime        = timeEntry.endDate;
    var durationString = timeEntry.duration;
    var timeLabel      = '<button type="button" class="btn btn-success btn-xs">Create Label</button>';

    if(timeEntry.timeLabel.length > 0)
    {
        timeLabel = timeEntry.timeLabel;
    }
    else if(includeDateStr) {
        timeLabel  = padDigits(startTime.getMonth(), 2) + "/" + padDigits(startTime.getDay(), 2) + "/" + padDigits(startTime.getFullYear(), 2) + " | "
            + padDigits(startTime.getHours(), 2) + ":" + padDigits(startTime.getMinutes(), 2) + ":" + padDigits(startTime.getSeconds(), 2) + " - "
            + padDigits(endTime.getHours(), 2) + ":" + padDigits(endTime.getMinutes(), 2) + ":" + padDigits(endTime.getSeconds(), 2);
    }
    // Only include a modal on an indivudal time entry, otherwise the session modal will
    // be triggered upon clicking individual times in a session.
    var modalStr ='<div class="timeEntry" id="te'+stateID+''+idPostFix+'">';
    if(isSingluar){
        modalStr = '<div draggable="true" id="te'+stateID+'" onclick="openModal('+stateID+')" class="timeEntry">';
    }

    var entry = modalStr+ '<div class="timeEntryLabel">'+timeLabel+'</div>\
    <div class="timeEntryDuration">'+durationString+'</div>\
    </div>';

    return $(entry).prependTo(parentID);
}

// Populate the time log given the state and parent container ID.
function populateTimeLog(state,timeLogID){

    // Console spice.
    var css = "font-size: 24px; color:blue;";
    var css2 = "font-size: 24px; color:green;";
    var css3 = "font-size: 15px; color:black;";
    console.log("%cTime"+"%cEZ: "+"%cAndrew Ribeiro", css,css2, css3);

    stateCounter = 0;

    state.forEach(function (timeState) {
        if(timeState != null) {
            if (timeState.sessionName == null) {
                // Restore objects from serlized state.
                timeState = constructFromSeralized(timeState);

                // We are not dealing with a time sesssion.

                entry = timeState.getEntries()[0];
                displayNewTime(entry, timeLogID, stateCounter,true, true,0);
            }
            else {
                // Dealing with a time session.
                timeStorageState[stateCounter] = constructFromSeralized(timeState);
                timeState                      = timeStorageState[stateCounter];
                entryies = timeState.getEntries();

                ts = createTimeSessionLogHTML(stateCounter, timeState.sessionName);

                $(ts).prependTo("#timeLog");

                console.log("Loaded a time session.");

                currentTimeSessionID = timeStorageState.length - 1;
            }

            stateCounter++
        }

    });

}

function sessionClick(id,event)
{
    if(event.srcElement.className != "btn sessionCollapseBttn close") {
       openModal(id);
    }
    else{
        expandSession(id);
    }
}

function expandSession(stateID)
{
    console.log("Expand session: "+stateID);

    // Togle Expanded/Minimized
    if( timeStorageState[stateID].isExpanded ) {

        $("#ts" + stateID).find(".timeSessionLog").html("");

        $("#ts" + stateID).find('.close').html("+");

        timeStorageState[stateID].isExpanded = false
    }
    else {
        var entryies = timeStorageState[stateID].getEntries();

        entryCounter = 0;

        entryies.forEach(function (entry) {
            timeRef = displayNewTime(entry, $("#ts" + stateID).find(".timeSessionLog"), stateID,false, false, entryCounter);
            entry.addViewRef("TimeLog",timeRef);
            entryCounter++;
        });

        timeStorageState[stateID].isExpanded = true;

        $("#ts" + stateID).find('.close').html("-");
    }

    // Unfocus the button.
    $("#ts" + stateID).find('.close').blur();

}

// TODO: Place this in the TimeStructure class.
function constructFromSeralized(obj)
{
    ts = new TimeStructure(obj.sessionName);

    // Turn the date objects back to Date().

    obj.timeEntries.forEach(function (timeEntry) {

        if(timeEntry != null) {
            var startTime = new Date(timeEntry.startTime);
            var endDate = new Date(timeEntry.endDate);
            var duration = timeEntry.duration;
            this.viewReferences = [];

            te = new TimeEntry(startTime, endDate, duration);
            te.setLabel(timeEntry.timeLabel);

            ts.timeEntries.push(te);
        }
    });

    return ts;
}

// TODO: Perhaps make a helper class with these methods.
function createTimeSessionLogHTML(currentTimeSesID,sessionName) {
    var ts = '<div ondrop="drop(event)" ondragover="allowDrop(event)" onclick="sessionClick('+currentTimeSesID+',event)" class="timeSession" id="ts'+currentTimeSesID+'">';
        ts += '<div class="sessionTopBar"><div class="sessionName">'+sessionName+'</div>';
        ts += '<button class="btn sessionCollapseBttn close">+</button></div>';
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

    var minutes = Math.floor(duration / 60) % 60;
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