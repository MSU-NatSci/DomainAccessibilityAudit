import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import ServerAPI from './ServerAPI';

class AuditList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      audits: null,
      password: null,
    };
    this.props.server.getAudits()
      .then((audits) => {
        this.setState({ audits });
      })
      .catch((err) => console.log(err));
  }
  
  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  
  openAudit(auditId) {
    this.props.history.push('/audits/' + auditId);
  }
  
  removeAudit(auditId) {
    this.props.server.removeAudit(auditId)
      .then(() => this.props.server.getAudits())
      .then((audits) => {
        this.setState({ audits });
      })
      .catch((err) => {
        console.log("Remove audit:");
        console.log(err);
        alert("Remove audit: " + err);
      });
  }
  
  render() {
    let auditsHTML = null;
    if (this.state.audits != null) {
      const sortedAudits = [...this.state.audits]
        .sort((a,b) => b.dateStarted - a.dateStarted);
      auditsHTML = sortedAudits.map(audit => (
        <tr key={audit._id}>
          <td className="code">{audit.initialDomainName}</td>
          <td>{audit.maxDepth}</td>
          <td>{(new Date(audit.dateStarted)).toLocaleString()}</td>
          <td>{audit.nbCheckedURLs}</td>
          <td>{audit.nbViolations}</td>
          <td>
            <button onClick={(e) => this.openAudit(audit._id)}>Open</button>{' '}
            {this.props.admin &&
              <button onClick={(e) => this.removeAudit(audit._id)}>Remove</button>
            }
          </td>
        </tr>
      ));
    }
    return (
      <>
        {this.props.admin ?
          <p><Link to="/audits/create" className="nav-link">Start a new audit</Link></p>
        :
          <form onSubmit={(e) => {
            e.preventDefault();
            this.props.login(this.state.password);
          }}>
            <label>
              Admin login:{' '}
              <input name="password" type="password" onChange={e => this.handleChange(e)}/>
            </label>{' '}
            <button type="submit">Log in</button>
          </form>
        }
        {auditsHTML &&
          <table>
            <caption>Saved Audits</caption>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Max Depth</th>
                <th>Date</th>
                <th>Checked URLs</th>
                <th>Violations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditsHTML}
            </tbody>
          </table>
        }
      </>
    );
  }
  
}

AuditList.propTypes = {
  admin: PropTypes.bool,
  login: PropTypes.func.isRequired,
  server: PropTypes.instanceOf(ServerAPI).isRequired,
};

export default AuditList;
