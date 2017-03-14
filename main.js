const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const btoa = require('btoa')
const http = require('http')

var ipc = require('electron').ipcMain;

var renderLine;

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}

var server = http.createServer();
var io = require('socket.io')(server);
var ss = require('socket.io-stream');
var fs = require('fs');
var PORT = 1025;
var CLIENT;
var timeStart = Date.now();
var photoStart = Date.now();
var transmitTime = Date.now() - timeStart;


const CHUNK_SIZE = 30720;

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    console.log("Goodbye");
    process.exit();
    return;
  }

  if (key.name === 'p') {
    timeStart = Date.now();
    console.log("Capturing photo");
    CLIENT.emit('photo-capture');
  }

  if (key.name === 'c') {
    console.log("Triggering capture");
    CLIENT.emit('trigger');
  }
});

ipc.on('init', function(event, arg){
  console.log("Init succesful");
  renderLine = event;
});

var photoData = [];

var getFrame = function(){
  http.get({
          host: '192.168.1.1',
          path: '/frame'
      }, function(response) {
          // Continuously update stream with data
          response.on('data', function(d) {

              // photoData += d.toString('base64');
              for(var i = 0; i < d.length; i++){
                photoData.push(d[i]);
              }
          });
          response.on('end', function() {
            var base64Data = _arrayBufferToBase64(photoData);
            // console.log(base64Data.length);
            // console.log("************************************************");
            // console.dir(photoData);
            // console.log("------------------------------------------------");
            renderLine.sender.send( 'render',  base64Data);
            photoData= [];
            getFrame();
          });
      });
};

ipc.on('live-view-frame', function(event, arg){
  timeStart = Date.now();
  // console.log("refreshing photo");
  // socket.emit('live-view-frame');
  getFrame();


});

io.on('connection', function(socket) {
  console.log("Connection succesful!");

  ipc.on('refresh-photo', function(event, arg){
    timeStart = Date.now();
    console.log("refreshing photo");
    socket.emit('capture-photo');
  });

  ipc.on('live-view-frame', function(event, arg){
    timeStart = Date.now();
    // console.log("refreshing photo");
    // socket.emit('live-view-frame');
  });

  CLIENT = socket;

  socket.on('push-photo', function(data){
    if(data.packet === 0){
      photoData = [];
      photoStart = Date.now();
    }

    transmitTime = Date.now() - timeStart;
    if(transmitTime > 250){
      timeStart = Date.now();
      // console.log("Packet "+data.packet+"/"+data.packets);
    }

    socket.emit('push-photo-success', {
      packet: data.packet, packets: data.packets
    });

    var i;
    for(i = 0; i < data.fd.length; i++){
      photoData.push(data.fd[i]);
    }

    renderLine.sender.send( 'progress',  {
      value: Math.round((data.packet / data.packets) * 100)
    });

  });

  socket.on('push-photo-complete', function(){
    var base64Data = _arrayBufferToBase64(photoData);
    transmitTime = Date.now() - photoStart;
    // console.log("Transmit time: "+transmitTime+"ms");
    renderLine.sender.send( 'progress',  {
      value: 100
    });
    renderLine.sender.send( 'render',  base64Data);
  });

  socket.on('disconnect', function(){
    console.log("Client disconnected");
  });
});

server.listen(PORT, function() {
    console.log('Pulse control initialized');
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 1000})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
