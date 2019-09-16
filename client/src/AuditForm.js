import React from 'react';

import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import PropTypes from 'prop-types';

import ServerAPI from './ServerAPI';
import './AuditForm.css';


class AuditForm extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      url: '',
      standard: 'wcag2aa',
      checkSubdomains: true,
      maxDepth: 1,
      maxPagesPerDomain: 0,
      sitemaps: false,
      includeMatch: '',
      browser: 'firefox',
      auditId: null,
    };
    this.checkDelay = 1000;
    this.checkInterval = null;
  }
  
  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked :
      (target.type === 'number' ? parseInt(target.value) : target.value);
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  
  async startAudit() {
    this.setState({ error: null });
    try {
      const audit = await this.props.server.startAudit(this.state.url,
        this.state.standard, this.state.checkSubdomains, this.state.maxDepth,
        this.state.maxPagesPerDomain, this.state.sitemaps, this.state.includeMatch,
        this.state.browser);
      this.props.history.push('/audits/' + audit.id + '/status');
    } catch (error) {
      this.setState({ error });
    }
  }
  
  render() {
    return (
      <section className="pageContent">
        {this.props.admin ?
          <>
          <h2>Start A New Audit</h2>
          <Breadcrumb>
            <LinkContainer to="/audits/">
              <Breadcrumb.Item>Audits</Breadcrumb.Item>
            </LinkContainer>
            <Breadcrumb.Item active>Start A New Audit</Breadcrumb.Item>
          </Breadcrumb>
          {this.state.error &&
            <Alert variant="danger" onClose={() => this.setState({ error: null })} dismissible>
              {this.state.error}
            </Alert>
          }
          <Form onSubmit={e => { e.preventDefault(); this.startAudit(); } } className="form mt-3">
            <Form.Group as={Row} controlId="url">
              <Form.Label column sm="5">Initial URL</Form.Label>
              <Col sm="7">
                <Form.Control name="url" type="url" size="35" value={this.state.url}
                  onChange={e => this.handleChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="standard">
              <Form.Label column sm="5">Standard</Form.Label>
              <Col sm="7">
                <Form.Control name="standard" as="select" value={this.state.standard}
                    onChange={e => this.handleChange(e)}>
                  <option value="wcag2a">WCAG 2.0 Level A</option>
                  <option value="wcag2aa">WCAG 2.0 Level AA</option>
                  <option value="wcag21aa">WCAG 2.1 Level AA</option>
                  <option value="section508">Section 508</option>
                </Form.Control>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="checkSubdomains">
              <Col sm="5"/>
              <Col sm="7">
                <Form.Check name="checkSubdomains" type="checkbox" value={this.state.checkSubdomains}
                  onChange={e => this.handleChange(e)} checked={this.state.checkSubdomains}
                  label="Check subdomains"/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="maxDepth">
              <Form.Label column sm="5">Maximum crawling depth</Form.Label>
              <Col sm="7">
                <Form.Control name="maxDepth" type="number" size="10" value={this.state.maxDepth}
                  onChange={e => this.handleChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="maxPagesPerDomain">
              <Form.Label column sm="5">Maximum number of pages checked per domain</Form.Label>
              <Col sm="7">
                <Form.Control name="maxPagesPerDomain" type="number" size="10" value={this.state.maxPagesPerDomain}
                  onChange={e => this.handleChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="sitemaps">
              <Col sm="5"/>
              <Col sm="7">
                <Form.Check name="sitemaps" type="checkbox" value={this.state.sitemaps}
                  onChange={e => this.handleChange(e)} checked={this.state.sitemaps}
                  label="Use site maps to discover pages"/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="includeMatch">
              <Form.Label column sm="5">Include only paths matching the regular
                expression</Form.Label>
              <Col sm="7">
                <Form.Control name="includeMatch" size="20" value={this.state.includeMatch}
                  onChange={e => this.handleChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="browser">
              <Form.Label column sm="5">Browser</Form.Label>
              <Col sm="7">
                <Form.Control name="browser" as="select" value={this.state.browser}
                    onChange={e => this.handleChange(e)}>
                  <option value="firefox">Firefox</option>
                  <option value="chrome">Chromium</option>
                </Form.Control>
              </Col>
            </Form.Group>
            <div className="text-center">
              <Button variant="primary" type="submit">
                Start Audit
              </Button>
            </div>
          </Form>
          </>
          :
          <p>You need admin priviledges to create a new audit.</p>
        }
      </section>
    );
  }
  
}

AuditForm.propTypes = {
  admin: PropTypes.bool,
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
};

export default AuditForm;
