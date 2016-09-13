var addCommas = function(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
var isNumeric = function (n){
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var SystemStatusBlockHeader = React.createClass({
  onClick(e){
    this.props.onClick&&this.props.onClick(e);
  },
  render(){
    return (
      <h4 className="hostname" style={this.props.style} onClick={this.onClick}>{this.props.children}</h4>
    );
  }
});

var SystemStatusMini = React.createClass({
  getInitialState(){
    var system = this.props.system;
    return {
      showText: false,
    };
  },
  showText(){
    if(this.props.onClick){
      var header = this.props.header || {
        collapsed: '$.hostname',
      };
      var f = Lambda(header.collapsed);
      var headerText = f(this.props.system);
      return this.props.onClick(headerText);
    }
  },
  render(){
    var system = this.props.system;
    var stats = this.props.stats;
    var headerStyle = {cursor: 'pointer', backgroundColor: 'green', color: 'white', marginTop: '5px'};
    if(system.cpu && system.cpu > 8.0){
      headerStyle.backgroundColor = 'yellow';
      headerStyle.color = 'black';
    }
    if(system.cpu && system.cpu > 10.0){
      headerStyle.backgroundColor = 'red';
      headerStyle.color = 'white';
    }
    var outerClassName = 'col-xl-1 col-lg-1 col-md-1 col-sm-6 col-xs-6';
    var headerText = (Math.round(system.cpu*100)/100)+'%';
    if(this.state.showText){
      outerClassName = 'col-xl-4 col-lg-4 col-md-4 col-sm-12 col-xs-12';
      headerText = this.state.headerText;
    }
    return(
      <div>
        <div className={outerClassName}>
          <div onClick={this.showText} onTouchStart={this.showText} style={headerStyle}>{headerText} &nbsp;</div>
        </div>
      </div>
    );
  }
});

var SystemStatusBlock = React.createClass({
  getInitialState(){
    var collapsable = typeof(this.props.collapsable)==='undefined'?true:this.props.collapsable;
    var collapsed = collapsable?this.props.collapsed:false;
    return {
      collapsable: collapsable,
      collapsed: collapsed
    };
  },
  toggleClick(e){
    e.preventDefault();
    this.setState({
      collapsed: !this.state.collapsed
    });
  },
  render(){
    var system = this.props.system;
    var stats = this.props.stats;
    var collapsable = this.props.collapsable;
    var collapsed = collapsable?this.state.collapsed:false;
    var header = this.props.header || {
      collapsed: '$.hostname',
      expanded: '$.hostname',
    };
    var f = collapsed?Lambda(header.collapsed):Lambda(header.expanded);
    var inner = Object.keys(stats).map(function(member, index){
      var label = stats[member];
      var val = isNumeric(system[member])?addCommas(system[member]):system[member];
      return (
        <div key={member+index}>
          <label>{label}:</label>
          <span className={member}>{val}</span>
        </div>
      );
    }.bind(this));
    var headerText = f(system);
    var click = collapsable?this.toggleClick:null;
    var headerStyle = collapsable?{cursor: 'pointer'}:null;
    var innerClassName = collapsable?'bs-callout bs-callout-info':'';
    var innerStyle = {
      display: collapsed?'none':''
    };
    if(system.cpu && system.cpu > 8.0){
      headerStyle.backgroundColor = 'yellow';
      headerStyle.color = 'black';
    }
    if(system.cpu && system.cpu > 10.0){
      headerStyle.backgroundColor = 'red';
      headerStyle.color = 'white';
    }
    var outerClassName = !collapsable?'bs-callout':'';
    outerClassName += ' col-xl-2 col-lg-3 col-md-4 col-sm-12 col-xs-12';

    return(
      <div>
        <div className={outerClassName}>
          <SystemStatusBlockHeader onClick={click} style={headerStyle}>{headerText}</SystemStatusBlockHeader>
          <div className={innerClassName} style={innerStyle}>
            {inner}
          </div>
        </div>
      </div>
    );
  }
});

var SystemStatus = React.createClass({
  getInitialState(){
    return {
      hoverText: 'Select to view',
      systems: [],
      stats: {
      },
      header: {

      }
    }
  },
  updateState(SystemStatus){
    var systems = SystemStatus.items();
    this.setState({
      systems: systems,
    });
  },
  componentDidMount(){
    DataStore.getStore('SystemStatus', function(err, SystemStatus){
      if(err){
        alert(err);
        return console.error(err);
      }
      this.unlisten = SystemStatus.listen(()=>this.updateState(SystemStatus));
      this.updateState(SystemStatus);
    }.bind(this));
    Loader.get('/api/v1/sysstat/display/config', function(err, display){
      if(err){
        alert(err.toString());
        return console.error(err);
      }
      this.setState(display);
    }.bind(this));
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  showText(text){
    if(this.state.tmr){
      clearTimeout(this.state.tmr);
    }
    this.setState({
      hoverText: text,
      tmr: setTimeout(()=>this.hoverLeave(), 5000)
    });
  },
  hoverLeave(){
    this.setState({
      hoverText: 'Select to view',
      tmr: false,
    });
  },
  render(){
    var collapsed = typeof(this.props.collapsed)==='undefined'?true:this.props.collapsed;
    var collapsable = typeof(this.props.collapsable)==='undefined'?true:this.props.collapsable;
    var mini = !!this.props.mini;
    var hoverText = this.state.hoverText;
/*
OLD:
{
    "_id" : ObjectId("572757d3ebd99c2f7d680015"),
    "name" : "classroom-ui",
    "envConfig" : "stg",
    "appVersion" : "2.78.10",
    "source" : "server",
    "hostname" : "stg-use1c-pr-09-ocv2-02x78x10-0009",
    "pid" : NumberInt(32047),
    "level" : NumberInt(30),
    "mem" : {
        "rss" : NumberInt(470519808),
        "heapTotal" : NumberInt(206666240),
        "heapUsed" : NumberInt(138147448)
    },
    "uptime" : NumberInt(124880),
    "inboundDepth" : NumberInt(0),
    "outboundDepth" : NumberInt(0),
    "cpu" : NumberInt(0),
    "msg" : "Server Status",
    "time" : ISODate("2016-05-02T13:36:19.617+0000"),
    "v" : NumberInt(0)
}
*/
/*
NEW:
{
    "_id" : ObjectId("57275791db3986951f7f377b"),
    "level" : NumberInt(20),
    "levelName" : "INFO",
    "dateTime" : ISODate("2016-05-02T13:35:13.651+0000"),
    "host" : "stg-use1b-pr-09-ocv2-03x00x07-0004",
    "pid" : NumberInt(8085),
    "version" : "3.0.33",
    "appName" : "Classroom-UI",
    "env" : "stg",
    "data" : [
        "Server Status",
        {
            "mem" : {
                "rss" : NumberInt(165756928),
                "heapTotal" : NumberInt(137221632),
                "heapUsed" : NumberInt(136030640)
            },
            "uptime" : 226556.073,
            "cpu" : NumberInt(0)
        }
    ]
}
*/
    var systems = this.state.systems.map((system)=>{
      if(system.data && system.data[0] === 'Server Status'){
        return {
          "_id" : system._id,
          "name" : system.appName,
          "envConfig" : system.env,
          "appVersion" : system.version,
          "source" : system.source || "server",
          "hostname" : system.host,
          "pid" : system.pid,
          "level" : system.level,
          "mem" : system.data[1].mem,
          "uptime" : system.data[1].uptime,
          "inboundDepth" : NaN,
          "outboundDepth" : NaN,
          "cpu" : system.data[1].cpu,
          "msg" : "Server Status",
          "time" : new Date(Date.parse(system.dateTime)),
          "status": system.status,
          "v" : 1
        };
      }
      return system;
    });
    var groups = systems.reduce((groups, system)=>{
      var version = system.appVersion;
      var env = system.envConfig;
      var key = version+' '+env;
      var group = groups[key] || (groups[key] = []);
      group.push(system);
      return groups;
    }, {});
    var status = Object.keys(groups).map((groupName)=>{
      var systems = groups[groupName];
      var status = systems.map((system)=>{
        if(mini){
          return <SystemStatusMini
                  system={system}
                  stats={this.state.stats}
                  header={this.state.header}
                  key={system._id}
                  collapsed={collapsed}
                  collapsable={collapsable}
                  onClick={this.showText}
                  />;
        }
        return <SystemStatusBlock
                system={system}
                stats={this.state.stats}
                header={this.state.header}
                key={system._id}
                collapsed={collapsed}
                collapsable={collapsable}
                />;
      });
      return (
        <div key={groupName} className="row">
          <h3>{groupName}</h3>
          {status}
        </div>
      );
    });
    return(
      <div className="row">
        <div className="">{hoverText}</div>
        {status}
      </div>
    );
  }
});

Actions.register(SystemStatus, {role: 'systemstatus-section'});
