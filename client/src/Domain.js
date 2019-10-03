import React, { Component } from 'react';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { LinkContainer } from 'react-router-bootstrap';

import ServerAPI from './ServerAPI';
import ViolationStats from './ViolationStats';
import Categories from './Categories';
import PageTable from './PageTable';


class Domain extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      domain: null,
      error: null,
    };
  }
  
  componentDidMount() {
    this.props.server.getDomain(this.props.match.params.domainId)
      .then((domain) => {
        this.setState({ domain });
      })
      .catch((error) => this.setState({ error }));
  }
  
  render() {
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
        {this.state.error &&
          <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
            {this.state.error}
          </Alert>
        }
        <h2>{this.state.domain ? <span className="code">{this.state.domain.name}</span> : ''}</h2>
        {this.state.domain &&
          <>
            <section>
              <h3>Statistics</h3>
              <Table bordered size="sm" className="data">
                <tbody>
                  <tr><th>Number of checked URLs</th><td>{this.state.domain.nbCheckedURLs}</td></tr>
                  <tr><th>Number of accessibility violations</th><td>{this.state.domain.nbViolations}</td></tr>
                </tbody>
              </Table>
            </section>
            <Categories categories={this.state.domain.categories}/>
            <ViolationStats stats={this.state.domain.violationStats}
              items={this.state.domain.pages} itemType="page"/>
            <PageTable domain={this.state.domain}/>
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
