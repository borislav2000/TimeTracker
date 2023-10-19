const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, 'RMTT.db')
let db = new sqlite3.Database(dbPath)
var $ = require( 'jquery' );
var dt = require( 'datatables.net' )();
var dataInformation = [[]]
var columnNames = []


function createReportTable(){
    db.all(`SELECT TTT.[Date]
    , T.TaskID
    , T.TaskName
    , round((SUM(TTT.TimeSpentInSeconds) / 60.0),2) AS TimeSpentInMinutes
FROM RMTT_Tasks T

LEFT JOIN (
SELECT TES.TaskID
        , strftime('%Y-%m-%d', TES.Timestamp) AS [Date]
        , TES.Timestamp AS [Timestamp_Started]
        , TEE.Timestamp AS [Timestamp_Ended]
        --, (julianday(TEE.Timestamp) - julianday(TES.Timestamp))
        , Cast ((julianday(TEE.Timestamp) - julianday(TES.Timestamp)) * 24 * 60 * 60 As Integer) AS [TimeSpentInSeconds]
FROM RMTT_TasksEvents TES
LEFT JOIN RMTT_TasksEvents TEE
    ON TES.TaskID = TEE.TaskID
    AND (TES.EventID + 1) = TEE.EventID
    AND TEE.EventType IN ('E')
WHERE (1=1)
    AND TES.EventType IN ('S')
    AND TEE.Timestamp IS NOT NULL
AND TEE.Timestamp > TES.Timestamp

) TTT
ON T.TaskID = TTT.TaskID

GROUP BY T.TaskID
    , T.TaskName
    , TTT.[Date]
    
;
`,function(err,row){
    console.log(row[0])
    for(var i = 0; i<Object.keys(row[0]).length; i++){
        columnNames.push({title:Object.keys(row[0])[i]})
    }
    
    
    for(var i = 0; i<row.length; i++){
        dataInformation[i] = []
        for(var j = 0; j<Object.keys(row[0]).length; j++){
            dataInformation[i].push(Object.values(row[i])[j])
        }

    }
   
    $('#example').DataTable( {
        data: dataInformation,
        columns: columnNames,
        iDisplayLength: 100,
        columnDefs:[{ targets: [0,1,3], className: 'dt-body-right' }]
    } );
})
}
// // $(document).ready(function() {
// //     $('#example').DataTable();
// // } );
