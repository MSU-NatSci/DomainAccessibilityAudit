import React, { Component } from 'react';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { LinkContainer } from 'react-router-bootstrap';
import PropTypes from 'prop-types';
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ServerAPI from './ServerAPI';


class Page extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      page: null,
      error: null,
    };
  }
  
  componentDidMount() {
    this.props.server.getPage(this.props.match.params.pageId)
      .then((page) => {
        document.title = "Accessibility Audit: " + page.url;
        this.setState({ page });
      })
      .catch((error) => this.setState({ error }));
  }
  
  render() {
    const impacts = new Map([
      ['minor', 0],
      ['moderate', 1],
      ['serious', 2],
      ['critical', 3],
    ]);
    return (
      <>
        <Breadcrumb>
          <LinkContainer to="/audits/">
            <Breadcrumb.Item>Audits</Breadcrumb.Item>
          </LinkContainer>
          {this.state.page &&
            <>
              <LinkContainer to={'/audits/'+this.state.page.auditId}>
                <Breadcrumb.Item>Audit</Breadcrumb.Item>
              </LinkContainer>
              <LinkContainer to={'/domains/'+this.state.page.domainId}>
                <Breadcrumb.Item>Domain</Breadcrumb.Item>
              </LinkContainer>
              <Breadcrumb.Item active>Page</Breadcrumb.Item>
            </>
          }
        </Breadcrumb>
        <h1>
          {this.state.page ? <span className="code">{this.state.page.url}</span> : ''}
        </h1>
        {this.state.error &&
          <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
            {this.state.error}
          </Alert>
        }
        {this.state.page &&
          <>
            <p className="text-center"><a href={this.state.page.url} target="_blank"
              rel="noopener noreferrer">Visit the page</a></p>
            {this.state.page.status && this.state.page.status !== '200' &&
              <Alert variant="danger">Page status: {this.state.page.status}</Alert>
            }
            {this.state.page.errorMessage &&
              <Alert variant="danger">Page error: {this.state.page.errorMessage}</Alert>
            }
            {this.state.page.violations.length === 0 &&
              <Alert variant="success">No violation</Alert>
            }
            {this.state.page.violations
              .sort((v1, v2) => impacts.get(v2.impact) - impacts.get(v1.impact))
              .map(violation => (
                <Table bordered size="sm" key={violation.id} className="data">
                  <tbody>
                    {/*<tr><th>Id</th><td className="code">{violation.id}</td></tr>*/}
                    <tr><th>Description</th><td>
                      {violation.description + ' '}
                      <Button variant="info" size="xs" title="Open rule description on Deque's website"
                          onClick={e => window.open(violation.descLink, '_blank')}>
                        <FontAwesomeIcon icon={faInfoCircle}/>
                      </Button>
                    </td></tr>
                    <tr><th>Impact</th><td className={violation.impact}>{violation.impact}</td></tr>
                    <tr><th>Category</th><td>{violation.category}</td></tr>
                    <tr><th>Nodes</th><td>
                      <Table bordered size="sm" className="data">
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
                      </Table>
                    </td></tr>
                  </tbody>
                </Table>
              ))
            }
          </>
        }
      </>
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
