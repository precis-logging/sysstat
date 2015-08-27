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
  render(){
    var collapsed = typeof(this.props.collapsed)==='undefined'?true:this.props.collapsed;
    var collapsable = typeof(this.props.collapsable)==='undefined'?true:this.props.collapsable;
    var status = this.state.systems.map((system)=>{
      return <SystemStatusBlock
              system={system}
              stats={this.state.stats}
              header={this.state.header}
              key={system._id}
              collapsed={collapsed}
              collapsable={collapsable}
              />;
    });
    return(
      <div className="row">
        {status}
      </div>
    );
  }
});

Actions.register(SystemStatus, {role: 'systemstatus-section'});
