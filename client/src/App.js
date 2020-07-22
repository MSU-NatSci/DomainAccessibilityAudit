import React, { Component } from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import { createBrowserHistory } from "history";
import { wrapHistory } from "oaf-react-router";

import './App.scss';
import Header from './Header';
import Footer from './Footer';
import ServerAPI from './ServerAPI';
import AuditForm from './audits/AuditForm';
import AuditList from './audits/AuditList';
import AuditStatus from './audits/AuditStatus';
import Audit from './audits/Audit';
import Domain from './audits/Domain';
import Page from './audits/Page';
import Permissions from './access/Permissions';
import UserList from './access/UserList';
import User from './access/User';
import GroupList from './access/GroupList';
import Group from './access/Group';

class App extends Component {
  
  constructor() {
    super();
    this.server = new ServerAPI();
    this.state = {
      permissions: null,
      displayLoading: false,
    };
    this.history = createBrowserHistory(); // or createHashHistory()
    wrapHistory(this.history);
    this.timer = setTimeout(() => {
      if (this.state.permissions == null) {
        // permissions still not loaded, display a loading message
        this.setState({ displayLoading: true });
      }
    }, 250);
    this.getPermissions();
  }
  
  async localLogin(username, password) {
    try {
      const user = await this.server.localLogin(username, password);
      if (!user)
        throw new Error("Login failed: Incorrect password.");
      else {
        const info = {
          authenticationMethod: 'local',
          user: user,
        };
        this.setState({ permissions: new Permissions(info) });
      }
    } catch (err) {
      throw new Error("Login failed: " + (err.message ? err.message : err));
    }
  }
  
  async logout() {
    try {
      await this.server.logout();
      await this.getPermissions();
    } catch (err) {
      alert("Logout error: " + (err.message ? err.message : err));
    }
  }
  
  async getPermissions() {
    try {
      const userInfo = await this.server.getCurrentUser();
      clearTimeout(this.timer);
      if (userInfo.authenticationError)
        alert(userInfo.authenticationError);
      this.setState({ permissions: new Permissions(userInfo), displayLoading: false });
    } catch (err) {
      clearTimeout(this.timer);
      this.setState({ permissions: null, displayLoading: false });
      alert(err);
    }
  }
  
  render() {
    return (
      <Router history={this.history}>
        <Header/>
        <main>
          { this.state.permissions == null ?
            this.state.displayLoading && <p>Loading permissions...</p>
            :
            <Switch>
              <Route exact path="/audits/create"
                render={(routerProps) => <AuditForm permissions={this.state.permissions}
                  server={this.server} {...routerProps} />} />
              <Route path="/audits/:auditId/status"
                render={(routerProps) => <AuditStatus server={this.server} {...routerProps} />} />
              <Route path="/audits/:auditId"
                render={(routerProps) => <Audit server={this.server} {...routerProps} />} />
              <Route path="/audits/"
                render={(routerProps) => <AuditList server={this.server}
                  permissions={this.state.permissions}
                  localLogin={(username, password) => this.localLogin(username, password)}
                  logout={() => this.logout()}
                  {...routerProps} />} />
              <Route path="/domains/:domainId"
                render={(routerProps) => <Domain server={this.server} {...routerProps} />} />
              <Route path="/pages/:pageId"
                render={(routerProps) => <Page server={this.server} {...routerProps} />} />
              <Route path="/users/create" render={(routerProps) => <User server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route path="/users/:userId" render={(routerProps) => <User server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route path="/users/" render={(routerProps) => <UserList server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route path="/groups/create" render={(routerProps) => <Group server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route path="/groups/:groupId" render={(routerProps) => <Group server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route path="/groups/" render={(routerProps) => <GroupList server={this.server}
                permissions={this.state.permissions}
                {...routerProps} />} />
              <Route render={(routerProps) => <AuditList server={this.server}
                permissions={this.state.permissions}
                localLogin={(username, password) => this.localLogin(username, password)}
                logout={() => this.logout()}
                {...routerProps} />}/>
            </Switch>
          }
        </main>
        <Footer/>
      </Router>
    );
  }
  
}

export default App;
