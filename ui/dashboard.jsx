var SystemStatusSection = React.createClass({
  render(){
    return(
      <div>
        <h2 className="sub-header">System Status</h2>
        <InjectedComponentSet
          tagName="div"
          containerRequired={false}
          matching={{role: 'systemstatus-section'}}
          exposedProps={{mini: true}}
          />
      </div>
    );
  }
});

Actions.register(SystemStatusSection, {role: 'dashboard-section'});
