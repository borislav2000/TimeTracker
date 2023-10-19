//Include the IPC Processses
const {
    ipcRenderer
} = electron;
const fs = require('fs')
var Timer = require('easytimer.js').Timer;

var ipc = electron.ipcRenderer
var confirmBtn = document.getElementsByClassName('confirmBtn')[0]
var activeTaskHeader = $('<div class=currentHeader>Task in progress</div>')
var activeTaskContainer = $('<div class=tasksContainer></div>')
var headerTasks = $('<div class="containerHeader">Recent Tasks</div>');
var taskContainer = '<div class="tasksContainer "></div>'
var exitOnErrorFlag = false;
var inputFieldValue;
var taskContainerNewInstance; 
var currentTaskID;
// var intervalFlag = false;
var taskTimer;
// var testTimer;
db.get("PRAGMA foreign_keys = ON")
var splitTime;
var secondsTest;
var timerFlag;
var openSettings = false;
var openReports = false;
var openRawReport = false;
var closeWindow = false;

const {remote} = require('electron')

var d = new Date();
  var setMonths = d.setMonth(d.getMonth()-2);
  var formatMonth = new Date(setMonths).toISOString().split('T')[0]
  var formatDate = formatMonth + " " + "00:00:00"
  console.log(formatDate)
// process.on('uncaughtException', function (error) {
//     $('.warning-msg').css('display', 'block')
//     $('.input-group').remove()
// })


// fs.access(dbPath, fs.F_OK, (err) => {
//     if (err) {
//       $('.warning-msg').css('display', 'block')
//       $('.input-group').remove()
//       return
//     }
  
//     //file exists
//   })

function checkForEmptyInput(){
    inputFieldValue = document.querySelector('input[type=text]').value
    if(inputFieldValue.length <= 0){
        $('.input-group').addClass('inputBorder')
    }
    else{
        $('.input-group').removeClass('inputBorder')
    }
}

function insertTask(){
    inputFieldValue = document.querySelector('input[type=text]').value
        
        db.serialize(() => {
            db.all('select seq from sqlite_sequence where name="RMTT_Tasks" ', function(err,row){
                currentTaskID = row[0]['seq'] + 1;
                db.run("INSERT INTO RMTT_Tasks(TaskName) VALUES(?)  ", inputFieldValue)
                checkForRunningTask()

            db.run('INSERT INTO RMTT_TasksEvents(TaskID, EventType, TaskActivityID) VALUES(?,?,?)'
                ,currentTaskID, "C", "100")
                
            })
            
        })

        // listAllTasks()
        $('.tasksContainer').remove()
        document.getElementById('myField').value = "";
        
    
    
    
}

$('.confirmBtn').on('click',function(e){
    inputFieldValue = document.querySelector('input[type=text]').value
    if(inputFieldValue.length <= 0){
        e.preventDefault()
    }
    else{
        insertTask()
        listAllTasks()
    }
})

document.getElementById('myField').onkeydown = function(e){
    inputFieldValue = document.querySelector('input[type=text]').value
    if(e.keyCode == 13 && inputFieldValue.length > 0){
        insertTask()
        listAllTasks()
        e.preventDefault()
    }
    else if(e.keyCode == 13 && inputFieldValue.length <= 0){
        e.preventDefault()
    }

}

function listAllTasks(){
        db.serialize(() => {
            db.all(`SELECT T.TaskID
                , T.TaskName
                , TE.COUNT_Events
                , TE.MAX_Timestamp
                , 0 AS ActualTime 
        FROM RMTT_Tasks T 
        INNER JOIN (
            SELECT TE.TaskID, COUNT(TE.EventID) AS [COUNT_Events], MAX(TE.Timestamp) AS [MAX_Timestamp]
            FROM RMTT_TasksEvents TE
            GROUP BY TE.TaskID
        ) TE
            ON T.TaskID = TE.TaskID
        WHERE TE.MAX_Timestamp > ?
        ORDER BY TE.MAX_Timestamp DESC
        ;`,formatDate, function(err, row){
                if(row[0] != undefined){   
                    $('body').append(headerTasks)
                    $('<div id=myList>').insertAfter(headerTasks)
                    for(var i = 0; i<row.length; i++){
                        // if((row[i].TaskName).length >= 20){
                            
                            taskContainerNewInstance =  '<div class="tasksContainer" title="'+ row[i]['TaskName'] +'"><div class="flex-child long-and-truncated options" ><a>'+ row[i].TaskName+'</a></div><div class="play"><i class="fa fa-play stopAndStart playHover '+row[i].TaskID+'" onclick="startStopTasks('+row[i].TaskID+')" title="Start timing this task"></i></div><div class=mySpan>00:00:00</div></div></div>'
                            // taskContainerNewInstance = '<div class=tasksContainer title='+row[i]["TaskName"]+'>'+row[i]["TaskName"]+'</div>'
                            
                           
                            // else{
                        //     taskContainerNewInstance =  '<div class="tasksContainer " id='+row[i].TaskID+'>' + row[i].TaskName + '<i class="fa fa-play stopAndStart playHover '+row[i].TaskID+'" onclick="startStopTasks('+row[i].TaskID+')" title="Start timing this task"></i><div class=mySpan>00:00:00</div></div>'

                        // }
                        // $('body').append(headerTasks)
                    // $('<div id=myList>').insertAfter(headerTasks)
                        $('#myList').append(taskContainerNewInstance)
                        
                        $('.confirmAndMinimize').css('display', 'none')
                    }
                    $(headerTasks).insertBefore('#myList')  
                }
                else{
                    $(headerTasks).remove()
                }
                
            })
        })
        return false;
    }

function checkForRunningTask(){
    db.serialize(()=>{
        db.all("SELECT Value FROM RMTT_SystemFlags WHERE Flag='ActiveTaskID'", function(err,row){
            if(row[0]['Value'] == null){
                console.log('null')
            }
            else{
                db.run("UPDATE RMTT_SystemFlags SET Value = ? WHERE Flag = 'ActiveTaskID'", null)
                db.run('INSERT INTO RMTT_TasksEvents(TaskID, EventType, TaskActivityID) VALUES(?,?,?)'
                ,row[0]['Value'], "E", "100")
            }
        })
    })
}


function startStopTasks(taskID){
    var test = $(event.target).parent().next()[0]
    var elapsedTime = $(test).text()
    splitTime = elapsedTime.split(":")
    secondsTest = (+splitTime[0]) * 60 * 60 + (+splitTime[1]) * 60 + (+splitTime[2]);
    if (!$(event.target).hasClass('started') && !$(event.target).hasClass('paused')) {
        document.getElementById("myField").value = "";
        filterTasks()
        if(elapsedTime != "00:00:00")
        {   
             taskTimer = new Timer()
             taskTimer.start({precision: 'seconds', startValues: {seconds: secondsTest}})
             taskTimer.addEventListener('secondsUpdated',function(e){
                $(test).html(taskTimer.getTimeValues().toString());
            })
        }
        else{
            taskTimer = new Timer()
            taskTimer.start()
            taskTimer.addEventListener('secondsUpdated',function(e){
            $(test).html(taskTimer.getTimeValues().toString());
        })
        }

        
        db.serialize(()=>{
            db.run('INSERT INTO RMTT_TasksEvents(TaskID, EventType, TaskActivityID) VALUES(?,?,?)'
            ,taskID, "S", "100")
            db.run("UPDATE RMTT_SystemFlags SET Value = ?  WHERE Flag = 'ActiveTaskID'", taskID)
        })

        var myInt = setInterval(function(){
            db.all("SELECT Value FROM RMTT_SystemFlags WHERE Flag ='AutoPauseSysFlag' ",function(err,row){
                        var autoPauseSysFlag = parseInt(row[0]['Value'],10)
                        if(autoPauseSysFlag == 1){
                            autoPauseStyles()
                            db.run(`INSERT INTO RMTT_TasksEvents(TaskID, EventType, TaskActivityID)
                            SELECT Value, 'E',100
                            FROM RMTT_SystemFlags
                            WHERE Flag='ActiveTaskID'
                                AND (1=(SELECT Value FROM RMTT_SystemFlags WHERE Flag='AutoPauseSysFlag'))
                            ;`)
                            db.run("UPDATE RMTT_SystemFlags SET Value = 0 WHERE Flag = 'AutoPauseSysFlag'")
                            db.run("UPDATE RMTT_SystemFlags SET Value = NULL WHERE Flag = 'ActiveTaskID'")
                        
                            taskTimer.pause()

                           
                        }
                    })
        }, 10000)
        
        topFunction()
        stylesForStartedTask()
        showConfirmButton()
        timerFlag = true;
        
        ipcRenderer.send('stopTimer', timerFlag)
        
    }

        else if($(event.target).hasClass('started')){
            taskTimer.pause()
            db.serialize(()=>{
                db.run("INSERT INTO RMTT_TasksEvents(TaskID, EventType, TaskActivityID) SELECT Value, 'E',100 FROM RMTT_SystemFlags WHERE Flag='ActiveTaskID'")

                db.run("UPDATE RMTT_SystemFlags SET Value = ? WHERE Flag = 'ActiveTaskID'",null)
                
            })
            stylesForPausedTask()
            $('.confirmAndMinimize').css('display', 'none')
            timerFlag = false
            ipcRenderer.send('stopTimer', timerFlag)
           
        }
}

function startAutoPause(taskID){
    $('.tasksContainer').attr('id',taskID).removeClass('activeTask')
    $('.tasksContainer').attr('id',taskID).children().first().removeClass('fa-pause selected').addClass('fa-play')
    $('.stopAndStart').removeClass('started').removeClass("paused ").bind('click').attr('title', 'Start timing this task').addClass('playHover')
    
}

function stylesForPausedTask(){
    $(event.target).removeClass('fa-pause selected')
    $(event.target).parent().parent().removeClass('activeTask')
    $('.stopAndStart').removeClass('started').removeClass("paused ").bind('click').attr('title', 'Start timing this task').addClass('playHover')
    
}

function stylesForStartedTask(){
    $(event.target).parent().parent().children().last().css('visibility', 'visible')
    $(event.target).addClass('started fa-pause selected').attr('title', 'Stop timing this task')
    $(event.target).parent().parent().insertAfter(headerTasks).addClass('activeTask') 
    $('.stopAndStart').not(event.target).addClass('paused').unbind('click').attr('title','There is another task you are currently timing').removeClass('playHover')
}


function exitOnError(){
    exitOnErrorFlag = true;
    ipcRenderer.send('exitOnError', exitOnErrorFlag)
}

function outOfFocus(){
    $('.input-group').removeClass('inputBorder')
}

// function checkForFlag(){
//     db.all("SELECT Value FROM RMTT_SystemFlags WHERE Flag ='AutoPauseSysFlag' ",function(err,row){
//         var autoPauseSysFlag = row[0]['Value']
//         if(autoPauseSysFlag == 1){}
//     })
// }

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  function startStopwatch(){
      startTimer.start()
      startTimer.addEventListener('secondsUpdated', function(e){

      })
  }

function autoPauseStyles(){
    db.all('SELECT Value FROM RMTT_SystemFlags WHERE Flag="ActiveTaskID"', function(err,row){    
    $('.tasksContainer').attr('id',row[0]['Value']).removeClass('activeTask')
    $('.tasksContainer').attr('id',row[0]['Value']).children().first().next().children().first().removeClass('fa-pause selected').addClass('fa-play')
    $('.stopAndStart').removeClass('started').removeClass("paused").bind('click').attr('title', 'Start timing this task').addClass('playHover')
    $('.confirmAndMinimize').css('display', 'none')
    })
}

function showConfirmButton(){
    $('.confirmAndMinimize').css('display','block').insertAfter('.activeTask')
}

function minimizeWindow(){
    remote.BrowserWindow.getFocusedWindow().minimize();
}

function showDropdown() {
    document.getElementById('myDropdown').classList.toggle("show")
}

function openSettingsMenu(){
    openSettings = true;
    ipcRenderer.send('openSettings', openSettings)
}

function openReportMenu(){
    openReports = true;
    ipcRenderer.send('openReports', openReports)
}

function openRawReportMenu(){
    openRawReport = true;
    ipcRenderer.send('openRawReports', openRawReport)
}

function closeMainWindow(){
    closeWindow = true;
    ipcRenderer.send('closeMainWindow', closeWindow)
}

function filterTasks(){
    var input, filer, taskList, li, a, i, txtValue;
    input = document.getElementById('myField')
    filter = input.value.toUpperCase()
    taskList = document.getElementById('myList')
    li = document.getElementsByClassName('tasksContainer')
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

