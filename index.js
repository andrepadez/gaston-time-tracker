var log = require('npmlog')
  , path = require('path')
  , Promise = require('bluebird')
  , mkdirp = Promise.promisify( require('mkdirp') )
  , fs = require('graceful-fs')
  , sh = require('shelljs')
  , sessionId = Math.floor( Math.random() * 1000000)
  , userName = getUserName()
  , sessionData
  , trackData
  , trackerFile
  , config;

Promise.promisifyAll(fs);


var Tracker = module.exports = {
  init: function(cfg){
    config = cfg;

    setup()
      .then(trackit);
    
    log.info('time-tracker', 'tracking time for this issue (p to pause or resume)');
  }, 

  toggle: function(){
    Tracker.isPaused = !Tracker.isPaused;
    if(Tracker.isPaused){
      log.info('time-tracker', 'Time Tracking is paused');
    } else {
      log.info('time-tracker', 'Time Tracking resumed');
      trackit();
    }
  },
  save: function(){
    console.log('saving');
    return writeToFile();
  }
};

var setup = function(){
  sessionData = {
    name: config.gitUser,
    branch: config.branch,
    start: new Date(),
    time: 0
  };

  return config.branchPromise
    .then(function(){
      var timeTrackingDir = path.join(config.basePath, 'time-tracking');
      trackerFile = path.join(timeTrackingDir, config.branch + '.json');
      fs.exists( trackerFile, function(exists){
        if(exists){ console.log('requiring')
          trackData = require(trackerFile);console.log('trackData', trackData)
          trackData.push(sessionData); 
        } else {
          mkdirp( timeTrackingDir )
            .then(function(){
              trackData = [];
              trackData.push(sessionData);
              return writeToFile()
            });
        }
      });
    });
}

var trackit = function(){

  (function tick(){
    setTimeout(function(){
      if(!Tracker.isPaused){
        sessionData.time++;
        var message = 'tracked: ' + getProperTime(sessionData.time);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(message + '     ')
        tick();
        if(sessionData.time%10 === 0){
          writeToFile();
        }
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
  return fs.writeFileAsync( trackerFile, JSON.stringify(trackData, null, 4) );
};

function getUserName(){
  return sh.exec('git config --global --get user.name', {
    silent: true
  }).output.replace('\n', '');
}