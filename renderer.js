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
var cfButton = document.getElementById('cf-button');

var frames = 0;
var timer = Date.now();

var getNextFrame = false;

var cameraProperty, cameraValue, valueIndex, cameraConfigs;

cfButton.addEventListener('click', function(){
  ipc.send('compression-factor', $('#compression-factor').val());
});

refreshButton.addEventListener('click', function () {
    getNextFrame = false;
    ipc.send('refresh-photo');
});

tlPreview.addEventListener('click', function () {
  console.log("Clicked tl preview button!");
    getNextFrame = !getNextFrame;
    ipc.send('tl-preview', getNextFrame);
    if(!getNextFrame){
      img.src="photo.jpg";
      $('#FPS').text('0');
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
    ipc.send('live-view-frame', getNextFrame);
    if(!getNextFrame){
      img.src="photo.jpg";
      $('#FPS').text('0');
    }
});

ipc.on('populate-configs', function(event, configs){
  console.log('Got camera configs');
  console.dir(configs);

  cameraConfigs = configs.main.children.capturesettings;

  var settings = configs.main.children.capturesettings;

  $('#camera-settings ul').empty();

  for(var prop in settings.children){
    $('#camera-settings ul').append('<li><a href="#" >'+settings.children[prop].label+'</a></li>');
  }
});

var populateValues = function(){
  for(var prop in cameraConfigs.children){
    if(prop == cameraProperty.replace(/\s/g,'').toLowerCase()){
      console.log("Found a match! " + prop);
      $('#camera-values ul').empty();
      var property = cameraConfigs.children[prop];
      console.dir(property);
      for(var val in property.choices){
        $('#camera-values ul').append('<li><a href="#" >'+property.choices[val]+'</a></li>');
      }
    }
  }
};

ipc.on('render', function(event, data){
  frames++;
  if(Date.now() - timer > 1000){
    var time = (Date.now() - timer) / 1000;
    console.log("FPS: "+frames / time);
    $('#FPS').text(Math.ceil(frames / time));
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

$(document).ready(function() {
    console.log("Ready. Loading watches...");
    $('#camera-settings').on( 'click', '.dropdown-menu li a', function() {
      console.log('item selected');
      cameraProperty = $(this).text();
       $('#setting-selected').text(cameraProperty);
       populateValues();
    });

    $('#camera-values').on( 'click', '.dropdown-menu li a', function() {

      cameraValue = $(this).text();
      valueIndex = $("#values-list li").index( $(this).parent());
      console.log('item selected: '+cameraValue + ' '+valueIndex);
      $('#value-selected').text(cameraValue);

      ipc.send('set-config', {config: cameraProperty.replace(/\s/g,'').toLowerCase(), value: cameraValue});
    });
});
