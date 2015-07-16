var log = require('npmlog')
  , path = require('path')
  , Promise = require('bluebird')
  , mkdirp = Promise.promisify( require('mkdirp') )
  , fs = require('graceful-fs')
  , config = require('../config')
  , sh = require('shelljs')
  , sessionId = Math.floor( Math.random() * 1000000)
  , userName = getUserName()
  , trackTime = 0
  , trackerFile
  , trackData


var Tracker = module.exports = {
  init: function(){
    setup()
      .then(trackit);
    
    log.info('tracker', 'tracking time for this issue (p to pause or resume)');
    
    process.on('SIGINT', function(){
      console.log();
      log.info('tracker', 'tracked', getProperTime(trackTime));
      process.exit(0);
    });
  }, 

  toggle: function(){
    Tracker.isPaused = !Tracker.isPaused;
    if(Tracker.isPaused){
      log.info('tracker', 'Time Tracking is paused');
    } else {
      log.info('tracker', 'Time Tracking resumed');
      trackit();
    }
  }
};


var setup = function(){
  return config.branchPromise
    .then(function(){
      var timeTrackingDir = path.join(config.basePath, 'time-tracking');
      trackerFile = path.join(timeTrackingDir, config.branch + '.log');
      fs.existsAsync( trackerFile )
        .then(function(exists){
          if(exists){
            trackData = require(trackerFile);
          } else {
            mkdirp( timeTrackingDir )
            trackData = [];
            writeToFile(trackerFile);
          }
        });
    });
}

var trackit = function(){
  var sessionData = trackData.filter(function(item){
    return sessionId = item.sessionId;
  });
  (function tick(){
    setTimeout(function(){
      if(!Tracker.isPaused){
        trackTime++;
        var message = 'tracked: ' + getProperTime(trackTime);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(message + '     ')
        tick();
      }
    }, 1000);
  })();
};

var getProperTime = function(secs){
  var hours = parseInt( secs / 3600 ) % 24;
  var minutes = parseInt( secs / 60 ) % 60;
  var seconds = secs % 60;

  return (hours < 10 ? '0' + hours : hours) + 'h' + 
    (minutes < 10 ? '0' + minutes : minutes) + 'm' + 
    (seconds  < 10 ? '0' + seconds : seconds) + 's';
};

var writeToFile = function(){
  return fs.writeFileAsync( trackerFile, JSON.stringify(trackData) );
};

function getUserName(){
  return sh.exec('git config --global --get user.name', {
    silent: true
  }).output.replace('\n', '');
}