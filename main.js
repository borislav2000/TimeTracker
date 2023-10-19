//Modules
const electron = require('electron');
const url = require('url');
const path = require('path');
const trayIcon = path.join(__dirname, 'clock-red.png')
const os = require('os');
const cmd = require('node-cmd')
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, 'RMTT.db')
let db = new sqlite3.Database(dbPath)
const {app, BrowserWindow, Tray, ipcMain, Menu} = require('electron');
var tray = null;
var mainWindow;
var configMenuWindow;
var reportsWindow
var rawReportsWindow
var mainWindowWidth;
var mainWindowHeight;
var getWindowHeight;
var getWindowWidth;
var getPositionX
var getPositionY
var removeErrorDialog = false;
var timer = null;
var isShown = false;
var Timer = require('easytimer.js').Timer;
var t1 = new Timer()
var t2 = new Timer()
var minimizeFlag = false;

function createConfigWindow(){
    configMenuWindow = new BrowserWindow({webPreferences: {
        nodeIntegration: true
    },width:500, height:648})
    

    configMenuWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'configWindow.html'),
        protocol: 'file:',
        slashes: true
        
    }))
}


function createReportsWindow(){
    reportsWindow = new BrowserWindow({webPreferences: {
        nodeIntegration: true
    },width:1100, height:700})

    reportsWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'reportsWindow.html'),
        protocol: 'file:',
        slashes: true
        
    }))
}

function createRawReportWindow(){
    rawReportsWindow = new BrowserWindow({webPreferences: {
        nodeIntegration: true
    },width:700, height:400})

    rawReportsWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'rawReportsWindow.html'),
        protocol: 'file:',
        slashes: true
        
    }))
}

//Listen for app to be ready
app.on('ready', function () {

        tray = new Tray(trayIcon)

        mainWindow = new BrowserWindow({
            icon: __dirname + '/clock-red.png',
            // skipTaskbar:true,
            webPreferences: {
                nodeIntegration: true
            },
            // width: 355,
            // height: 620,
            
            // resizable:false
        });

       
        // // Remove the top menu
        mainWindow.removeMenu()

        
            db.all(`SELECT Value FROM RMTT_Config WHERE Definition IN ('MainWindowOnReady_SetWidth', 'MainWindowOnReady_SetHeight');`, function (err,row){
                mainWindowWidth = parseInt(row[1]['Value'],10)
                mainWindowHeight = parseInt(row[0]['Value'],10)
                mainWindow.setSize(mainWindowWidth,mainWindowHeight)
            })
        
    
            db.all(`SELECT Value FROM RMTT_Config WHERE Definition IN ('MainWindowOnReady_SetPositionX', 'MainWindowOnReady_SetPositionY');`, function (err,row){
                var mainWindowPositionY = parseInt(row[1]['Value'],10)
                var mainWindowPositionX = parseInt(row[0]['Value'],10)
                mainWindow.setPosition(mainWindowPositionX, mainWindowPositionY)
                
            })
        
        
        

        mainWindow.on('minimize',function(){
            
            db.all(`SELECT Value FROM RMTT_Config WHERE Definition IN ('IntervalInMin_AutoDisplay', 'IntervalInMin_AutoPause');`, function(err,row){
                var IntervalInMin_AutoDisplay = parseInt(row[0]['Value'],10)
                var IntervalInMin_AutoPause = parseInt(row[1]['Value'],10)
                t1.stop()
                t2.stop()
                console.log(t2.isRunning())
                t1.start({countdown:true, startValues:{minutes: IntervalInMin_AutoDisplay}})
                t1.addEventListener('targetAchieved', function(e){
                    mainWindow.show()
                    isShown = true;
                    
                    t2.start({countdown: true, startValues:{minutes: IntervalInMin_AutoPause}})
                    t2.addEventListener('targetAchieved', autoPauseTimer)
                   
                })
                db.all("SELECT Value FROM RMTT_SystemFlags WHERE Flag = 'ActiveTaskID'", function(err,row){
                    if((row[0]['Value'] != null) && isShown == true){
                        t2.stop()
                    }
                })

                // if(timer != null){
                //     clearTimeout(timer)
                //     clearTimeout(t1)

                //     t1 = setTimeout(autoShowTimer,IntervalInMS_AutoDisplay)
                //     timer = setTimeout(autoPauseTimer, IntervalInMS_AutoPause)
                // }
                // else{
                //     t1 = setTimeout(autoShowTimer)
                //     // timer = setTimeout(autoPauseTimer, IntervalInMS_AutoPause)
                // }
                // setTimeout(function(){
                //     mainWindow.show()
                //     isShown = true;
                //     if(isShown == true){
                //         console.log('pause timer has started')

                //         setTimeout(autoPauseTimer, IntervalInMS_AutoPause)
                //         isShown = false;
                //     }
                //     console.log('showTimer has stopped')
                // },IntervalInMS_AutoDisplay)
                            
            })
        })

        //Load the HTML file into the window
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'mainWindow.html'),
            protocol: 'file:',
            slashes: true
            
        }))
        
        // // Remove the top menu
        // mainWindow.removeMenu()
        
        const ctxMenu = Menu.buildFromTemplate([{
            label: 'Exit',
            icon: path.join(__dirname, './quit-icon.png'),
            click:function(){
                mainWindow.close()
            }
        }])

        tray.setContextMenu(ctxMenu)

        //On double-click reopen the main window
        tray.on('double-click', () => {
            mainWindow.show();
        })

        mainWindow.on('close',function(){
            
                db.run('UPDATE RMTT_Config SET Value = ? WHERE Definition="MainWindowOnReady_SetHeight"', parseInt(mainWindow.getSize()[1]),10)
                db.run('UPDATE RMTT_Config SET Value = ? WHERE Definition="MainWindowOnReady_SetWidth"', parseInt(mainWindow.getSize()[0]))
                db.run('UPDATE RMTT_Config SET Value = ? WHERE Definition="MainWindowOnReady_SetPositionX"', mainWindow.getPosition()[0])
                db.run('UPDATE RMTT_Config SET Value = ? WHERE Definition="MainWindowOnReady_SetPositionY"', mainWindow.getPosition()[1])
                db.run('INSERT INTO RMTT_Debug (Value) VALUES(?)', 'App closed.')

            
                db.run('INSERT INTO RMTT_Debug (Value) VALUES(?)', 'Update values failure.')
            
            
        })

        //On hover on the system tray icon this text appears
        tray.setToolTip('RM TimeTracker App')

        ipcMain.on('exitOnError', function(e, exitOnErrorFlag){
            if(exitOnErrorFlag == true){
                mainWindow.close()
            }
        })

        // function autoShowTimer(){
        //     mainWindow.show()
        // }
        
        function autoPauseTimer(){
            db.all("SELECT Value FROM RMTT_SystemFlags WHERE Flag = 'ActiveTaskID'", function(err,row){
                if(row[0]['Value'] != null){
                    db.run("UPDATE RMTT_SystemFlags SET Value = 1 WHERE Flag = 'AutoPauseSysFlag'")
                }
            })
        }

        process.on('uncaughtException', function (error) {
            removeErrorDialog =true;
        })

        ipcMain.on('stopTimer', function(e, timerFlag){
            if(timerFlag == true){
                t2.stop()
            }
        })

        ipcMain.on('openSettings', function(e, openSettings){
            if(openSettings == true){
               createConfigWindow()
            }
        })
        ipcMain.on('openReports', function(e, openReports){
            if(openReports == true){
               createReportsWindow()
            }
        })

        ipcMain.on('closeMainWindow', function(e, closeWindow){
            if(closeWindow == true){
                mainWindow.close()
            }
        })

        ipcMain.on('openRawReports', function(e, openRawReport){
            if(openRawReport == true){
                createRawReportWindow()
            }
        })
})
