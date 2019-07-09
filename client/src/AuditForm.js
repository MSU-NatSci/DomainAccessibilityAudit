import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import ServerAPI from './ServerAPI';

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
      status: {},
      running: false,
      browser: 'firefox',
      auditId: null,
    };
    this.checkDelay = 1000;
    this.checkInterval = null;
  }
  
  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  
  startAudit() {
    this.props.server.startAudit(this.state.url, this.state.standard,
        this.state.checkSubdomains, this.state.maxDepth, this.state.maxPagesPerDomain,
        this.state.sitemaps, this.state.includeMatch, this.state.browser)
      .then((data) => {
        this.setState({
          running: true,
          auditId: data._id,
        });
        this.checkInterval = setInterval(() => this.checkStatus(), this.checkDelay);
      },
      error => this.setState({ error }));
  }
  
  stopAudit() {
    this.props.server.stopAudit()
      .then((data) => {
        this.setState({
          running: false
        });
      },
      error => this.setState({ error }));
  }
  
  checkStatus() {
    this.props.server.getAuditStatus()
      .then((data) => {
        if (!data.running && this.checkInterval != null) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
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
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      });
  }
  
  render() {
    return (
      <section>
        {this.props.admin ?
          <>
          <h1>Start A New Audit</h1>
          {this.state.error && <p className="error">{this.state.error}</p>}
          <section>
            <label>Initial URL:{' '}
              <input name="url" size="30" value={this.state.url}
                onChange={e => this.handleChange(e)}/>
            </label>{' '}
            <button onClick={e => this.startAudit()} disabled={this.state.running}>Start Audit</button>{' '}
            <button onClick={e => this.stopAudit()} disabled={!this.state.running}>Stop</button>
          </section>
          <section>
            <h1>Options</h1>
            <p>
              <label>Standard:{' '}
                <select name="standard" value={this.state.standard}
                    onChange={e => this.handleChange(e)}>
                  <option value="wcag2a">WCAG 2.0 Level A</option>
                  <option value="wcag2aa">WCAG 2.0 Level AA</option>
                  <option value="wcag21aa">WCAG 2.1 Level AA</option>
                  <option value="section508">Section 508</option>
                </select>
              </label>
            </p>
            <p>
              <label>Check subdomains:{' '}
                <input type="checkbox" name="checkSubdomains"
                  checked={this.state.checkSubdomains} onChange={e => this.handleChange(e)}/>
              </label>
            </p>
            <p>
              <label>Maximum crawling depth:{' '}
                <input name="maxDepth" size="10" value={this.state.maxDepth}
                  onChange={e => this.handleChange(e)}/>
              </label>
            </p>
            <p>
              <label>Maximum number of pages checked per domain:{' '}
                <input name="maxPagesPerDomain" size="10" value={this.state.maxPagesPerDomain}
                  onChange={e => this.handleChange(e)}/>
              </label>
            </p>
            <p>
              <label>Use <a href="https://www.sitemaps.org/" target="_blank" rel="noopener noreferrer">site maps</a> to discover pages:{' '}
                <input type="checkbox" name="sitemaps"
                  checked={this.state.sitemaps} onChange={e => this.handleChange(e)}/>
              </label>
            </p>
            <p>
              <label>Include only paths matching the regular expression:{' '}
                <input name="includeMatch" size="20" value={this.state.includeMatch}
                  onChange={e => this.handleChange(e)}/>
              </label>
            </p>
            <p>
              <label>Browser:{' '}
                <select name="browser" value={this.state.browser}
                    onChange={e => this.handleChange(e)}>
                  <option value="firefox">Firefox</option>
                  <option value="chrome">Chromium</option>
                </select>
              </label>
            </p>
          </section>
          {this.state.status && this.state.status.running !== undefined &&
            <section>
              <h1>Status</h1>
              <ul>
                <li>Running: {this.state.status.running ? "Yes" : "No"}</li>
                <li>Checked URLs: {this.state.status.nbCheckedURLs}</li>
                <li>URLs to check: {this.state.status.nbURLsToCheck} (more might be added later)</li>
                <li>Violations found: {this.state.status.nbViolations}</li>
              </ul>
            </section>
          }
          {this.state.auditId &&
            <section>
              <h1>Results</h1>
              <Link to={'/audits/'+this.state.auditId} className="nav-link">Audit results</Link>
            </section>
          }
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
};

export default AuditForm;
