var Page = React.createClass({
  render(){
    return (
      <div>
        <div><h1>System Status</h1></div>
        <InjectedComponentSet
          tagName="div"
          containerRequired={false}
          matching={{role: 'systemstatus-section'}}
          exposedProps={{collapsable: false}}
          />
      </div>
    );
  }
});

Pages.register('SystemStatus', Page);
