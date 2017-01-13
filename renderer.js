// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var ipc = require('electron').ipcRenderer;
var img = document.getElementById('photo-render');
var refreshButton = document.getElementById('refresh');
var progressBar = document.getElementById('p-bar');

refreshButton.addEventListener('click', function () {

    ipc.send('refresh-photo');
});

ipc.on('render', function(event, data){
  console.log("Rendering photo");
  img.src = 'data:image/jpeg;base64,' + data;
});

ipc.on('progress',function(event, data){
  progressBar.value = data.value;
});

ipc.send('init');
