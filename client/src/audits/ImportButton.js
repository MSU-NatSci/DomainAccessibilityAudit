import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import PropTypes from 'prop-types';

import ServerAPI from '../ServerAPI';


class ImportButton extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      displayForm: false,
      status: null,
      error: null,
    };
  }
  
  displayForm() {
    this.setState({ displayForm: true });
  }
  
  hideForm() {
    this.setState({ displayForm: false });
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.error && !prevState.error)
      document.querySelector('.alert').focus();
  }
  
  importListener(e) {
    const ff = e.target;
    if (!ff.files)
      return;
    this.setState({ status: "Loading..." });
    const f = ff.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', async () => {
      this.setState({ status: "Importing..." });
      try {
        await this.props.server.importAudit(reader.result);
      } catch (error) {
        if (error.message.startsWith('Timeout')) {
          this.setState({ status:
            "This import is taking a while, reload the list of audits later."
          });
        } else {
          this.setState({ error: "Error importing the audit: " +
            error.message, status: null });
        }
        return;
      }
      this.props.getAudits();
      this.setState({ displayForm: false, status: null });
    }, false);
    if (f.name.endsWith('.gz'))
      reader.readAsArrayBuffer(f);
    else
      reader.readAsText(f);
  }
  
  render() {
    return (
      <>
        <Button onClick={() => this.setState({ displayForm: true })}>
          Import Audit
        </Button>
        <Modal show={this.state.displayForm} onHide={() => this.hideForm()}>
          <Modal.Header closeButton>
            <Modal.Title>Import an Audit</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert show={this.state.error != null} variant="danger" dismissible
                onClose={() => this.setState({ error: null })} tabIndex="0">
              {this.state.error}
            </Alert>
            <Form>
              <Form.File id="import" custom
                label="Click to select an audit to import"
                onChange={e => this.importListener(e)}/>
            </Form>
            {this.state.status &&
              <p>{this.state.status}</p>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.hideForm()}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

ImportButton.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  getAudits: PropTypes.func.isRequired,
};

export default ImportButton;
