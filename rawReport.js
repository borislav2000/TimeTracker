const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'RMTT.db')

let db = new sqlite3.Database(dbPath)
var outputString = ""
var stringHeaders = ""
function renderRawReport(){
    db.all(`  
    SELECT TES.TaskID
            , T.TaskName
           -- , strftime('%Y-%m-%d', TES.Timestamp) AS [Date]
            , TES.Timestamp AS [Timestamp_Started]
            , TEE.Timestamp AS [Timestamp_Ended]
            --, (julianday(TEE.Timestamp) - julianday(TES.Timestamp))
            , Cast ((julianday(TEE.Timestamp) - julianday(TES.Timestamp)) * 24 * 60 * 60 As Integer) AS [TimeSpentInSeconds]
    FROM RMTT_TasksEvents TES
    INNER JOIN RMTT_Tasks T
        ON TES.TaskID = T.TaskID
    LEFT JOIN RMTT_TasksEvents TEE
        ON TES.TaskID = TEE.TaskID
        AND (TES.EventID + 1) = TEE.EventID
        AND TEE.EventType IN ('E')
    WHERE (1=1)
        AND TES.EventType IN ('S')
        AND TEE.Timestamp IS NOT NULL
    AND TEE.Timestamp > TES.Timestamp
`, function(err,row){
    for(var i = 0; i<Object.keys(row[0]).length; i++){
        stringHeaders += Object.keys(row[0])[i] + '\t'
    }
    $('.rawReportArea').append(stringHeaders + '\n')
    for(var j = 0; j< row.length; j++){
        
        outputString += row[j]['TaskID'] + "\t" + row[j]['TaskName'] + '\t' + row[j]['Timestamp_Started'] + '\t' + row[j]['Timestamp_Ended'] + '\t'+ row[j]['TimeSpentInSeconds'] + '\t' + '\n'
    }
  
    $('.rawReportArea').append(outputString)
})
}


function myFunction() {
    var copyText = document.getElementById("myArea");
    copyText.select()
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Text copied successfully!"
  }
  
  function outFunc() {
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copy to clipboard";
  }