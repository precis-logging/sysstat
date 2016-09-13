var utils = require('precis-utils');

const STALE_THREASHOLD = 1000 * 60 * 5;
const DEAD_THREASHOLD = 1000 * 60 * 60 * 24;

var Handler = function(options){
  this.event = options.event;
  this.sockets = options.sockets;
  this.logger = options.logger;
  this.buckets = {};
};

/*
"data" : [
    "Server Status",
    {
        "mem" : {
            "rss" : NumberInt(232517632),
            "heapTotal" : NumberInt(207918944),
            "heapUsed" : NumberInt(181356472)
        },
        "uptime" : 23.685,
        "cpu" : 0.09990009990000696
    }
]
*/

Handler.prototype.enqueueUpdate = function(){
  if(this._updateTimer){
    return;
  }
  var sendUpdates = function(){
    this._updateTimer = false;
    /*
    var updates = [].concat.apply([], Object.keys(this.buckets).map(function(key){
      return this.buckets[key];
    }.bind(this)));
    //*/
    var updates = Object.keys(this.buckets).map(function(key){
      var record = this.buckets[key].length?this.buckets[key][this.buckets[key].length-1]:null;
      return record;
    }.bind(this));
    this.sockets.emit(this.event, updates);
  }.bind(this);
  this._updateTimer = setTimeout(sendUpdates, 1000);
};

Handler.prototype.push = function(rec){
  var isStatusMessage = (rec.msg && rec.msg === 'Server Status') ||
                        (rec.data && rec.data[0] === 'Server Status');
  if(!isStatusMessage){
    return;
  }
  var host = rec.hostname || rec.host;
  var pid = rec.pid;
  var bucket = this.getBucket(host);
  if(bucket.length>=99){
    bucket.shift();
  }
  var details = Object.assign({}, rec, {status: 'Alive', _id: host+'@'+pid});
  bucket.push(details);
  //this.sockets.emit(this.event, details);
  this.enqueueUpdate();
  this.checkStale();
};

Handler.prototype.getBucket = function(host){
  if(this.buckets[host]){
    return this.buckets[host];
  }

  return this.buckets[host] = [];
};

Handler.prototype.checkStale = function(){
  if(this._staleTimeout){
    clearTimeout(this._staleTimeout);
  }
  var now = new Date().getTime();
  this._staleTimeout = setTimeout(function(){
    this.buckets = Object.keys(this.buckets).filter(function(name){
      var bucket = this.buckets[name];
      if(!bucket.length){
        return false;
      }
      var info = bucket[bucket.length-1];
      var recTime = info.time || info.dateTime;
      var time = new Date(Date.parse(recTime)).getTime();
      return (now - time < DEAD_THREASHOLD);
    }.bind(this)).reduce(function(set, name){
      var bucket = this.buckets[name];
      var info = bucket[bucket.length-1];
      var recTime = info.time || info.dateTime;
      var time = new Date(Date.parse(recTime)).getTime();
      if(now - time > STALE_THREASHOLD){
        bucket.status = 'Dead';
      }
      set[info.hostname]=bucket;
      return set;
    }.bind(this), {});
  }.bind(this), 100);
};

module.exports = {
  Handler: Handler
};
