import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import ServerAPI from './ServerAPI';

class Page extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      page: null,
    };
    this.props.server.getPage(this.props.match.params.pageId)
      .then((page) => {
        this.setState({ page });
      })
      .catch((err) => console.log(err));
  }
  
  render() {
    const impacts = new Map([
      ['minor', 0],
      ['moderate', 1],
      ['serious', 2],
      ['critical', 3],
    ]);
    return (
      <section>
        <p className="path">
          <Link to="/audits/" className="nav-link">Audits</Link>
          {this.state.page &&
            <>
              {' '}/{' '}
              <Link to={'/audits/'+this.state.page.auditId}
                className="nav-link">Audit</Link>
              {' '}/{' '}
              <Link to={'/domains/'+this.state.page.domainId}
                className="nav-link">Domain</Link>
            </>
          }
        </p>
        <h1>
          {this.state.page ? <span className="code">{this.state.page.url}</span> : 'Page'}
        </h1>
        {this.state.page && this.state.page.status && this.state.page.status !== '200' &&
          <p>Status: {this.state.page.status}</p>
        }
        {this.state.page &&
          <p><a href={this.state.page.url} target="_blank"
            rel="noopener noreferrer">Visit the page</a></p>
        }
        {this.state.page &&
          <>
            {this.state.page.violations.length === 0 && <span>None</span>}
            {this.state.page.violations
              .sort((v1, v2) => impacts.get(v2.impact) - impacts.get(v1.impact))
              .map(violation => (
              <table key={violation.id}>
                <tbody>
                  {/*<tr><th>Id</th><td className="code">{violation.id}</td></tr>*/}
                  <tr><th>Description</th><td>
                    <a href={violation.descLink} target="_blank" rel="noopener noreferrer">{violation.description}</a>
                  </td></tr>
                  <tr><th>Impact</th><td className={violation.impact}>{violation.impact}</td></tr>
                  <tr><th>Nodes</th><td>
                    <table>
                      <thead>
                        <tr><th>Target</th><th>HTHML</th></tr>
                      </thead>
                      <tbody>
                        {violation.nodes.map(node => (
                          <tr key={node._id}>
                            <td className="code">{node.target}</td>
                            <td className="code">{node.html}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td></tr>
                </tbody>
              </table>
            ))}
            {this.state.page.errorMessage &&
              <p>Error: {this.state.page.errorMessage}</p>
            }
          </>
        }
      </section>
    );
  }
  
}

Page.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      pageId: PropTypes.string.isRequired,
    })
  }),
};

export default Page;
