// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var ipc = require('electron').ipcRenderer;
var img = document.getElementById('photo-render');
var refreshButton = document.getElementById('refresh');
var liveViewButton = document.getElementById('live-view');
var tlButton = document.getElementById('tl-button');
var hdrButton = document.getElementById('hdr-button');
var tlPreview = document.getElementById('tl-preview');
var progressBar = document.getElementById('p-bar');

var frames = 0;
var timer = Date.now();

var getNextFrame = false;

refreshButton.addEventListener('click', function () {
    getNextFrame = false;
    ipc.send('refresh-photo');
});

tlPreview.addEventListener('click', function () {
  console.log("Clicked tl preview button!");
    getNextFrame = !getNextFrame;
    if(getNextFrame){
      ipc.send('tl-preview', getNextFrame);
    }

});

hdrButton.addEventListener('click', function(){
  var hdrObject = {
    evPerStep: $('#ev-steps').val(),
    steps: $('#hdr-photos').val(),
  };
  ipc.send('hdr', hdrObject);
});

tlButton.addEventListener('click', function(){
  var tlObject = {
    interval: $('#tl-interval').val(),
    photos: $('#tl-photos').val()
  };
  ipc.send('timelapse', tlObject);
});

liveViewButton.addEventListener('click', function () {
  console.log("Clicked live view button!");

    getNextFrame = !getNextFrame;
    if(getNextFrame){
      ipc.send('live-view-frame', getNextFrame);
    }
});

ipc.on('render', function(event, data){
  frames++;
  if(Date.now() - timer > 1000){
    var time = (Date.now() - timer) / 1000;
    console.log("FPS: "+frames / time);
    frames = 0;
    timer = Date.now();
  }
  img.src = 'data:image/jpeg;base64,' + data;
  // if(getNextFrame){
  //   ipc.send('live-view-frame');
  // }
});

ipc.on('progress',function(event, data){
  progressBar.value = data.value;
});

ipc.send('init');
