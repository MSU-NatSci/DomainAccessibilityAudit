import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import './App.css';
import ServerAPI from './ServerAPI';
import AuditForm from './AuditForm';
import AuditList from './AuditList';
import Audit from './Audit';
import Domain from './Domain';
import Page from './Page';

class App extends Component {
  
  constructor() {
    super();
    this.server = new ServerAPI();
  }
  
  render() {
    return (
      <BrowserRouter>
        <main>
          <h1>Domain Accessibility Audit</h1>
          <Switch>
            <Route exact path='/audits/create'
              render={(routerProps) => <AuditForm server={this.server} {...routerProps} />} />
            <Route path='/audits/:auditId'
              render={(routerProps) => <Audit server={this.server} {...routerProps} />} />
            <Route path='/audits/'
              render={(routerProps) => <AuditList server={this.server} {...routerProps} />} />
            <Route path='/domains/:domainId'
              render={(routerProps) => <Domain server={this.server} {...routerProps} />} />
            <Route path='/pages/:pageId'
              render={(routerProps) => <Page server={this.server} {...routerProps} />} />
            <Route render={(routerProps) => <AuditList server={this.server} {...routerProps} />}/>
          </Switch>
        </main>
      </BrowserRouter>
    );
  }
  
}

export default App;
