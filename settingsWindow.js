var headerTasks = $('<div class="containerHeader">Main Window Settings</div>');
var taskContainer = '<div class="tasksContainer"></div>'

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'RMTT.db')
let db = new sqlite3.Database(dbPath)


function listSettings(){
    $('body').append(headerTasks)

    db.all('SELECT * FROM RMTT_Config',function(err,row){
        $('<div id=mySettings>').insertAfter(headerTasks)
        for(var j = 0; j<row.length; j++){
            $('#mySettings').append('<div class="tasksContainer">' + row[j]['Definition']+'<form><input type=text class=inputSettings value="'+row[j]['Value']+'"></input></form></div>')
        }
        $('<button type="button" value="Save" class="save-button" onclick="updateSettings()">Save</button>').insertAfter('#mySettings')
    })
}

function updateSettings(){
    var inputFields = document.getElementsByClassName('inputSettings')
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'IntervalInMin_AutoDisplay'", inputFields[0].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'IntervalInMin_AutoPause'", inputFields[1].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'MainWindowOnReady_SetPositionX'", inputFields[2].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'MainWindowOnReady_SetPositionY'", inputFields[3].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'MainWindowOnReady_SetHeight'", inputFields[4].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'MainWindowOnReady_SetWidth'", inputFields[5].value)
    db.run("UPDATE RMTT_Config SET Value = ? WHERE Definition = 'AppVersion'", inputFields[6].value)
    if($('.confirm-msg').css('visibility', 'hidden')){
        $('.confirm-msg').css('visibility', 'visible')
    }
}