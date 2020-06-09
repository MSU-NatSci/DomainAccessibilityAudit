import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { faTrashAlt, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import ImportButton from './ImportButton';
import Login from '../access/Login';
import Permissions from '../access/Permissions';
import ServerAPI from '../ServerAPI';


class AuditList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      audits: null,
      username: null,
      password: null,
      error: null,
    };
  }
  
  async componentDidMount() {
    await this.getAudits();
    document.title = "Accessibility Audits";
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.error && !prevState.error)
      document.querySelector('.alert').focus();
  }
  
  async getAudits() {
    try {
      const audits = await this.props.server.getAudits();
      this.setState({ audits });
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  async localLogin(username, password) {
    await this.props.localLogin(username, password);
    this.getAudits();
  }
  
  async logout() {
    await this.props.logout();
    this.getAudits();
  }
  
  removeAudit(auditId) {
    this.props.server.removeAudit(auditId)
      .then(() => this.props.server.getAudits())
      .then((audits) => {
        this.setState({ audits });
      })
      .catch((error) => {
        this.setState({ error: "Remove audit: " + error });
      });
  }
  
  exportAudit(auditId) {
    this.props.server.exportAudit(auditId);
  }
  
  render() {
    if (!this.props.permissions)
      return null;
    let auditsHTML = null;
    const anyPermission = this.props.permissions.anyPermission();
    if (anyPermission && this.state.audits != null) {
      const sortedAudits = [...this.state.audits]
        .sort((a,b) => b.dateStarted - a.dateStarted);
      auditsHTML = sortedAudits.map(audit => (
        this.props.permissions.domainReadAllowed(audit.initialDomainName) &&
        <tr key={audit._id}>
          <td className="code"><Link to={'/audits/'+audit._id}>{audit.initialDomainName}</Link></td>
          <td className="text-right">{(new Date(audit.dateStarted)).toLocaleDateString()}</td>
          <td className="text-right">{audit.nbCheckedURLs}</td>
          <td className="text-right">{audit.nbViolations}</td>
          {this.props.permissions.domainDeleteAllowed(audit.initialDomainName) &&
            <td className="text-right">
              <Button title="Remove" variant="danger" size="xs" onClick={(e) => this.removeAudit(audit._id)}><FontAwesomeIcon icon={faTrashAlt} title="Remove" /></Button>
              {this.props.permissions.anyAuditCreateAllowed() &&
                <Button title="Export Results" variant="info" size="xs" onClick={(e) => this.exportAudit(audit._id)}><FontAwesomeIcon icon={faDownload} title="Export Results" /></Button>
              }
            </td>
          }
        </tr>
      ));
    }
    return (
      <>
        <h1>Accessibility Audits</h1>
        <Alert show={this.state.error != null} variant="danger" dismissible
            onClose={() => this.setState({ error: null })} tabIndex="0">
          {this.state.error}
        </Alert>
        <Login server={this.props.server} permissions={this.props.permissions}
          localLogin={(u,p) => this.localLogin(u,p)} logout={() => this.logout()}/>
        {!anyPermission &&
          <>
            <p>You do not currently have any permission.</p>
            {!this.props.permissions.loggedIn() &&
              <p>You might want to log in.</p>
            }
          </>
        }
        {this.props.permissions.anyAuditCreateAllowed() &&
          <>
            <LinkContainer to="/audits/create">
              <Button>Start a new audit</Button>
            </LinkContainer>
            {' '}
            <ImportButton server={this.props.server} getAudits={
              () => this.getAudits()}/>
          </>
        }
        {this.props.permissions.userAndGroupEditAllowed() &&
          <>
            {' '}
            <LinkContainer to="/users/">
              <Button>Users</Button>
            </LinkContainer>
            {' '}
            <LinkContainer to="/groups/">
              <Button>Groups</Button>
            </LinkContainer>
          </>
        }
        {auditsHTML &&
          <section>
            <h2>Saved Audits</h2>
            <Table bordered size="sm" className="data">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th className="text-right">Date</th>
                  <th className="text-right">Checked URLs</th>
                  <th className="text-right">Violations</th>
                  {this.props.permissions.anyAuditCreateAllowed() &&
                    <th className="text-right"></th>}
                </tr>
              </thead>
              <tbody>
                {auditsHTML}
              </tbody>
            </Table>
          </section>
        }
      </>
    );
  }
  
}

AuditList.propTypes = {
  permissions: PropTypes.instanceOf(Permissions),
  localLogin: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  server: PropTypes.instanceOf(ServerAPI).isRequired,
};

export default AuditList;
