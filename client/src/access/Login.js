import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import PropTypes from 'prop-types';

import ServerAPI from '../ServerAPI';
import Permissions from './Permissions';


class Login extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      password: null,
      displayForm: false,
      error: null,
    };
  }
  
  login() {
    // the first Login button was clicked
    if (this.props.permissions.authenticationMethod === 'SAML')
      this.props.server.samlLogin();
    else
      this.displayForm();
  }
  
  async localLogin() {
    // the form login button was clicked
    try {
      await this.props.localLogin(this.state.username, this.state.password);
      this.setState({ error: null });
      this.hideForm();
    } catch (error) {
      this.setState({ error: error.message });
    }
  }

  logout() {
    this.props.logout();
  }

  handleChange(event) {
    const target = event.target;
    this.setState({
      [target.name]: target.value
    });
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
    if (this.state.displayForm && !prevState.displayForm)
      document.getElementById('username').focus();
    // modal accessibility issue: see
    // https://github.com/dequelabs/axe-core/issues/1482#issuecomment-502392478
    // should we fix that here ?
  }
  
  render() {
    return (
      <>
        {(this.props.permissions && this.props.permissions.loggedIn()) ?
          <>
            <Button variant="secondary" onClick={() => this.logout()} className="float-right">
              Log out
            </Button>
          </>
          :
          <Button onClick={() => this.login()}
              className="float-right">
            Login
          </Button>
        }
        <Modal show={this.state.displayForm} onHide={() => this.hideForm()}>
          <Form onSubmit={(e) => { e.preventDefault(); this.localLogin(); }}>
            <Modal.Header closeButton>
              <Modal.Title>Login</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert show={this.state.error != null} variant="danger" dismissible
                  onClose={() => this.setState({ error: null })} tabIndex="0">
                {this.state.error}
              </Alert>
              <Form.Group controlId="username">
                <Form.Label className="mx-2">Username</Form.Label>
                <Form.Control className="mx-2" name="username" type="text" onChange={e => this.handleChange(e)}/>
              </Form.Group>
              <Form.Group controlId="password">
                <Form.Label className="mx-2">Password</Form.Label>
                <Form.Control className="mx-2" name="password" type="password" onChange={e => this.handleChange(e)}/>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => this.hideForm()}>
                Cancel
              </Button>
              <Button type="submit">Log in</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </>
    );
  }
}

Login.propTypes = {
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  permissions: PropTypes.instanceOf(Permissions),
  localLogin: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
};

export default Login;
