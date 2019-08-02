import React, { Component } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap'

import ServerAPI from './ServerAPI';
import ViolationStats from './ViolationStats';


class Domain extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      domain: null,
    };
    this.props.server.getDomain(this.props.match.params.domainId)
      .then((domain) => {
        this.setState({ domain });
      })
      .catch((err) => console.log(err));
  }
  
  render() {
    let pagesHTML = null;
    if (this.state.domain != null) {
      const sortedPages = [...this.state.domain.pages]
        .sort((p1, p2) => {
          const dv = p2.nbViolations - p1.nbViolations;
          if (dv !== 0)
            return dv;
          return p1.url.localeCompare(p2.url);
        });
      pagesHTML = sortedPages.map(page => (
        <tr key={page._id}><td className="code">
            <Link to={'/pages/'+page._id}>{page.url}</Link>
          </td>
          <td className="text-right">{page.nbViolations}</td>
        </tr>
      ));
    }
    return (
      <section className="pageContent">
        <Breadcrumb>
          <LinkContainer to="/audits/">
            <Breadcrumb.Item>Audits</Breadcrumb.Item>
          </LinkContainer>
          {this.state.domain &&
            <>
              <LinkContainer to={'/audits/'+this.state.domain.auditId}>
                <Breadcrumb.Item>Audit</Breadcrumb.Item>
              </LinkContainer>
              <Breadcrumb.Item active>Domain</Breadcrumb.Item>
            </>
          }
        </Breadcrumb>
        <h2>{this.state.domain ? <span className="code">{this.state.domain.name}</span> : ''}</h2>
        {this.state.domain &&
          <>
            <Table bordered size="sm" className="data">
              <caption>STATISTICS</caption>
              <tbody>
                <tr><th>Number of checked URLs</th><td>{this.state.domain.nbCheckedURLs}</td></tr>
                <tr><th>Number of accessibility violations</th><td>{this.state.domain.nbViolations}</td></tr>
              </tbody>
            </Table>
            <ViolationStats stats={this.state.domain.violationStats}
              items={this.state.domain.pages} itemType="page"/>
            <Table bordered size="sm" className="data">
              <caption>SCANNED PAGES<br/>
              Click on a URL to get a full report for that page.</caption>
              <thead>
                <tr><th>URL</th><th className="text-right">Violations</th></tr>
              </thead>
              <tbody>
                {pagesHTML}
              </tbody>
            </Table>
          </>
        }
      </section>
    );
  }
  
}

Domain.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      domainId: PropTypes.string.isRequired,
    })
  }),
};

export default Domain;
