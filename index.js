var Joi = require('joi');
var path = require('path');
var Handler = require('./lib/handler').Handler;
var utils = require('precis-utils');
var defaults = utils.defaults;

var getLatestStatus = function(req, reply){
  var handler = this.handler;
  if(req.params.hostname){
    var bucket = handler.buckets[req.params.hostname] || [];
    if(!bucket.length){
      return reply(false);
    }
    var instances = bucket.reduce((info, host)=>{
      var instance = info[host.pid] || (info[host.pid] = host);
      if((new Date(instance.time).getTime()) > (new Date(info[host.pid].time).getTime())){
        info[host.pid] = host;
      }
      return info;
    }, {});

    return reply(Object.keys(instances).map((key)=>instances[key]));
  }
  return reply(Object.keys(handler.buckets).map(function(name){
    var bucket = handler.buckets[name];
    var pkt = bucket.length?bucket[bucket.length-1]:null;
    if(pkt){
      pkt = defaults(pkt, {_id: pkt.hostname+'@'+pkt.pid});
    }
    return pkt;
  }));
};

var getDisplayConfig = function(req, reply){
  var config = this.config.display;
  return reply(config);
};

var routes = function(){
  return [
    {
      method: 'GET',
      path: '/api/v1/sysstat/display/config',
      config:{
        description: 'Returns the System Status Display Object configuration',
        tags: ['api'],
        handler: getDisplayConfig.bind(this)
      },
    },
    {
      method: 'GET',
      path: '/api/v1/sysstat/latest',
      config:{
        description: 'Returns the latest systems status',
        tags: ['api'],
        handler: getLatestStatus.bind(this)
      },
    },
    {
      method: 'GET',
      path: '/api/v1/sysstat/latest/{hostname}',
      config:{
        description: 'Returns the latest system status for {hostname}',
        tags: ['api'],
        validate: {
          params: {
            hostname: Joi.string().required()
          }
        },
        handler: getLatestStatus.bind(this)
      },
    },
  ];
};

var registerUi = function(){
  return [
    {
      pages: [
        {
          route: '/system/status',
          title: 'Status',
          name: 'SystemStatus',
          section: 'System',
          filename: path.resolve(__dirname, 'ui/status.jsx'),
        },
      ]
    },
    {
      components: [
        {
          name: 'SystemStatusDashboard',
          filename: path.resolve(__dirname, 'ui/dashboard.jsx'),
        },
        {
          name: 'SystemStatusComponents',
          filename: path.resolve(__dirname, 'ui/components.jsx'),
        },
      ],
    },
    {
      stores: [
        {
          name: 'SystemStatus',
          socketEvent: {
            event: 'sysstats::update',
            prefetch: '/api/v1/sysstat/latest',
          }
        }
      ]
    },
  ];
};

var Plugin = function(options){
};

Plugin.prototype.init = function(options){
  var logger = options.logger;
  var config = this.config = defaults({display: {}}, options);
  var sockets = this.sockets = options.sockets;

  this.handler = new Handler(defaults({
    logger: logger,
    sockets: sockets,
    event: 'sysstats::update',
  }, config));
};

Plugin.prototype.register = function(options){
  var register = options.register;
  register({
    ui: registerUi.call(this),
    server: routes.call(this)
  });
};

Plugin.prototype.push = function(record){
  if(!this.handler){
    return setImmediate(function(){
      this.push(record);
    }.bind(this));
  }
  this.handler.push(record);
};

module.exports = Plugin;
