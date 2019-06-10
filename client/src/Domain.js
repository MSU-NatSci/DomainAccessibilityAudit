import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

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
            <Link to={'/pages/'+page._id} className="nav-link">{page.url}</Link>
          </td>
          <td>{page.nbViolations}</td>
        </tr>
      ));
    }
    return (
      <section>
        <p className="path">
          <Link to="/audits/" className="nav-link">Audits</Link>{' '}/{' '}
          {this.state.domain &&
            <Link to={'/audits/'+this.state.domain.auditId}
              className="nav-link">Audit</Link>
          }
        </p>
        <h1>{this.state.domain ? <span className="code">{this.state.domain.name}</span> : 'Domain'}</h1>
        {this.state.domain &&
          <>
            <table>
              <caption>STATISTICS</caption>
              <tbody>
                <tr><th>Number of checked URLs</th><td>{this.state.domain.nbCheckedURLs}</td></tr>
                <tr><th>Number of accessibility violations</th><td>{this.state.domain.nbViolations}</td></tr>
              </tbody>
            </table>
            <ViolationStats stats={this.state.domain.violationStats}
              items={this.state.domain.pages} itemType="page"/>
            <table>
              <caption>SCANNED PAGES<br/>
              Click on a URL to get a full report for that page.</caption>
              <thead>
                <tr><th>URL</th><th>Violations</th></tr>
              </thead>
              <tbody>
                {pagesHTML}
              </tbody>
            </table>
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
