import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import ServerAPI from './ServerAPI';


class AuditStatus extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      status: {},
      running: false,
      requestedStop: false,
    };
    this.checkDelay = 1000;
    this.checkInterval = null;
  }
  
  componentDidMount() {
    this.checkInterval = setInterval(() => this.checkStatus(), this.checkDelay);
  }
  
  componentWillUnmount() {
    if (this.checkInterval != null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  checkStatus() {
    this.props.server.getAuditStatus(this.props.match.params.auditId)
      .then((data) => {
        if (!data.running && this.checkInterval != null) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        document.title = "Audit Status: " + data.initialDomainName;
        this.setState({
          status: data,
          running: data.running,
        });
      },
      error => {
        this.setState({
          error: error,
          status: null,
        });
      });
  }
  
  stopAudit() {
    this.setState({ requestedStop: true });
    this.props.server.stopAudit(this.props.match.params.auditId)
      .then((data) => {
        this.setState({
          running: false
        });
      },
      error => {
        this.setState({ error, requestedStop: false });
      });
  }
  
  render() {
    return (
      <>
        <Breadcrumb>
          <LinkContainer to="/audits/">
            <Breadcrumb.Item>Audits</Breadcrumb.Item>
          </LinkContainer>
          <Breadcrumb.Item active>Audit Status</Breadcrumb.Item>
        </Breadcrumb>
        <h1>{this.state.status && this.state.status.initialDomainName ?
          this.state.status.initialDomainName : 'Audit Status'}</h1>
        {this.state.error &&
          <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
            {this.state.error}
          </Alert>
        }
        {this.state.status && this.state.status.running &&
          <p className="m-5">
            <Button variant="danger" size="sm"
                onClick={e => this.stopAudit()}
                disabled={!this.state.running || this.state.requestedStop}>
              Stop the audit
            </Button>
          </p>
        }
        {this.state.status && this.state.status.running !== undefined &&
          <section>
            <h2>Status</h2>
            <Table bordered size="sm" className="data">
              <tbody>
                <tr>
                  <th>Running</th>
                  <td>{this.state.status.running ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <th>Checked URLs</th>
                  <td>{this.state.status.nbCheckedURLs}</td>
                </tr>
                <tr>
                  <th>URLs to check</th>
                  <td>{this.state.status.nbURLsToCheck} (more might be added later)</td>
                </tr>
                <tr>
                  <th>Violations found</th>
                  <td>{this.state.status.nbViolations}</td>
                </tr>
                <tr>
                  <th>Scan errors</th>
                  <td>{this.state.status.nbScanErrors}</td>
                </tr>
              </tbody>
            </Table>
          </section>
        }
        <section>
          <h2>Results</h2>
          <Link to={'/audits/'+this.props.match.params.auditId}>Audit results</Link>
        </section>
      </>
    );
  }
  
}

AuditStatus.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      auditId: PropTypes.string.isRequired,
    })
  }),
};

export default AuditStatus;
