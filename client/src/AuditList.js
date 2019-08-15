import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap'

import ServerAPI from './ServerAPI';


class AuditList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      audits: null,
      password: null,
      error: null,
    };
  }
  
  componentDidMount() {
    this.props.server.getAudits()
      .then((audits) => {
        this.setState({ audits });
      })
      .catch((error) => this.setState({ error }));
  }
  
  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
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
  
  render() {
    let auditsHTML = null;
    if (this.state.audits != null) {
      const sortedAudits = [...this.state.audits]
        .sort((a,b) => b.dateStarted - a.dateStarted);
      auditsHTML = sortedAudits.map(audit => (
        <tr key={audit._id}>
          <td className="code"><Link to={'/audits/'+audit._id}>{audit.initialDomainName}</Link></td>
          <td className="text-right">{(new Date(audit.dateStarted)).toLocaleDateString()}</td>
          <td className="text-right">{audit.nbCheckedURLs}</td>
          <td className="text-right">{audit.nbViolations}</td>
          {this.props.admin &&
            <td className="text-right">
                <Button title="Remove" variant="danger" size="xs" onClick={(e) => this.removeAudit(audit._id)}><FontAwesomeIcon icon={faTrashAlt} title="Remove" /></Button>
            </td>
          }
        </tr>
      ));
    }
    return (
      <section className="pageContent">
        {this.state.error &&
          <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
            {this.state.error}
          </Alert>
        }
        {this.props.admin ?
          <>
            <Button variant="secondary" onClick={e => this.props.logout()} className="float-right">
              Log out
            </Button>
            <LinkContainer to="/audits/create">
              <Button>Start a new audit</Button>
            </LinkContainer>
          </>
        :
          <Form inline onSubmit={(e) => {
            e.preventDefault();
            this.props.login(this.state.password);
          }}>
            <Form.Group controlId="password">
              <Form.Label className="mx-2">Admin login</Form.Label>
              <Form.Control className="mx-2" name="password" type="password" onChange={e => this.handleChange(e)}/>
            </Form.Group>
            <Button className="mx-2" size="sm" type="submit">Log in</Button>
          </Form>
        }
        {auditsHTML &&
          <Table bordered size="sm" className="data">
            <caption>Saved Audits</caption>
            <thead>
              <tr>
                <th>Domain</th>
                <th className="text-right">Date</th>
                <th className="text-right">Checked URLs</th>
                <th className="text-right">Violations</th>
                {this.props.admin &&
                  <th className="text-right"></th>
                }
              </tr>
            </thead>
            <tbody>
              {auditsHTML}
            </tbody>
          </Table>
        }
      </section>
    );
  }
  
}

AuditList.propTypes = {
  admin: PropTypes.bool,
  login: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  server: PropTypes.instanceOf(ServerAPI).isRequired,
};

export default AuditList;
