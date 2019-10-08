import React, { Component } from 'react';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Table from 'react-bootstrap/Table';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';

import ServerAPI from './ServerAPI';
import ViolationStats from './ViolationStats';
import Categories from './Categories';
import DomainTable from './DomainTable';
import PageTable from './PageTable';


class Audit extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      audit: null,
      domain: null, // used when there is only 1 domain for the audit
      error: null,
    };
  }
  
  componentDidMount() {
    this.props.server.getAudit(this.props.match.params.auditId)
      .then((audit) => {
        document.title = "Accessibility Audit: " + audit.initialDomainName;
        this.setState({ audit });
        if (audit.domains && audit.domains.length === 1) {
          // load the domain when there is only 1 for the audit
          this.props.server.getDomain(audit.domains[0].id)
            .then((domain) => {
              this.setState({ domain });
            })
            .catch((error) => this.setState({ error }));
        }
      })
      .catch((error) => this.setState({ error }));
  }
  
  render() {
    const standardTitles = {
      wcag2a: "WCAG 2.0 Level A",
      wcag2aa: "WCAG 2.0 Level AA",
      wcag21aa: "WCAG 2.1 Level AA",
      section508: "Section 508",
    };
    return (
      <>
        <Breadcrumb>
          <LinkContainer to="/audits/">
            <Breadcrumb.Item>Audits</Breadcrumb.Item>
          </LinkContainer>
          <Breadcrumb.Item active>Audit</Breadcrumb.Item>
        </Breadcrumb>
        {this.state.error &&
          <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
            {this.state.error}
          </Alert>
        }
        <h1>{this.state.audit ?
          <span className="code">{this.state.audit.initialDomainName}</span>
          : ''}</h1>
        {this.state.audit &&
          <>
            <section>
              <h2>Audit Parameters</h2>
              <Table bordered size="sm" className="data">
                <tbody>
                  <tr>
                    <th>First URL</th>
                    <td className="code">{this.state.audit.firstURL}</td>
                  </tr>
                  <tr>
                    <th>Standard</th>
                    <td>{standardTitles[this.state.audit.standard]}</td>
                  </tr>
                  <tr>
                    <th>Check subdomains</th>
                    <td className="code">{this.state.audit.checkSubdomains ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <th>Maximum depth</th>
                    <td>{this.state.audit.maxDepth}</td>
                  </tr>
                  <tr>
                    <th>Maximum number of pages checked per domain</th>
                    <td>{this.state.audit.maxPagesPerDomain}</td>
                  </tr>
                  <tr>
                    <th>Use site maps</th>
                    <td className="code">{this.state.audit.sitemaps ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <th>Include only paths matching the regular expression</th>
                    <td className="code">{this.state.audit.includeMatch}</td>
                  </tr>
                  <tr>
                    <th>Web browser</th>
                    <td>{this.state.audit.browser}</td>
                  </tr>
                  <tr>
                    <th>Additional delay to let dynamic pages load (ms)</th>
                    <td>{this.state.audit.postLoadingDelay}</td>
                  </tr>
                  <tr>
                    <th>Date started</th>
                    <td>{(new Date(this.state.audit.dateStarted)).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Date ended</th>
                    <td>{this.state.audit.dateEnded &&
                      (new Date(this.state.audit.dateEnded)).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Audit completed</th>
                    <td>{this.state.audit.complete ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <th>Number of checked URLs</th>
                    <td>{this.state.audit.nbCheckedURLs}</td>
                  </tr>
                  <tr>
                    <th>Number of accessibility violations</th>
                    <td>{this.state.audit.nbViolations}</td>
                  </tr>
                  <tr>
                    <th>Number of scan errors</th>
                    <td>{this.state.audit.nbScanErrors}</td>
                  </tr>
                </tbody>
              </Table>
            </section>
            <Categories categories={this.state.audit.categories}/>
            {this.state.domain ?
              <>
                <ViolationStats stats={this.state.domain.violationStats}
                  items={this.state.domain.pages} itemType="page"/>
                <PageTable domain={this.state.domain}/>
              </>
              :
              <>
                <ViolationStats stats={this.state.audit.violationStats}
                  items={this.state.audit.domains} itemType="domain"/>
                <DomainTable audit={this.state.audit}/>
              </>
            }
          </>
        }
      </>
    );
  }
  
}

Audit.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      auditId: PropTypes.string.isRequired,
    })
  }),
};

export default Audit;
