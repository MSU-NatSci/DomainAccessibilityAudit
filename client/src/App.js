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
    this.state = {
      admin: null,
    };
    this.checkIfAdmin();
  }
  
  login(password) {
    this.server.login(password)
      .then((admin) => {
        this.setState({ admin });
        if (!admin)
          alert("Incorrect password.");
      })
      .catch((err) => {
        console.log("Login:");
        console.log(err);
        this.setState({ admin: false });
      });
  }
  
  checkIfAdmin() {
    return this.server.admin()
      .then((admin) => {
        this.setState({ admin });
      })
      .catch((err) => {
        console.log("checkIfAdmin:");
        console.log(err);
        this.setState({ admin: false });
      });
  }
  
  render() {
    return (
      <BrowserRouter>
        <main>
          <h1>Domain Accessibility Audit</h1>
          <Switch>
            <Route exact path='/audits/create'
              render={(routerProps) => <AuditForm admin={this.state.admin}
                server={this.server} {...routerProps} />} />
            <Route path='/audits/:auditId'
              render={(routerProps) => <Audit server={this.server} {...routerProps} />} />
            <Route path='/audits/'
              render={(routerProps) => <AuditList server={this.server}
                admin={this.state.admin}
                login={(password) => this.login(password)}
                {...routerProps} />} />
            <Route path='/domains/:domainId'
              render={(routerProps) => <Domain server={this.server} {...routerProps} />} />
            <Route path='/pages/:pageId'
              render={(routerProps) => <Page server={this.server} {...routerProps} />} />
            <Route render={(routerProps) => <AuditList server={this.server}
              admin={this.state.admin}
              login={(password) => this.login(password)}
              {...routerProps} />}/>
          </Switch>
        </main>
      </BrowserRouter>
    );
  }
  
}

export default App;
