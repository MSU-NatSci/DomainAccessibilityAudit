import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import ServerAPI from '../ServerAPI';
import Permissions from './Permissions';


class User extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      user: {
        _id: this.props.match.params.userId,
        username: '',
        firstname: '',
        lastname: '',
        password: '',
      },
      error: null,
      success: null,
      allGroups: null,
      groupsToAdd: null,
      selectedGroup: null,
    };
  }
  
  async componentDidMount() {
    try {
      if (this.state.user._id != null) {
        const user = await this.props.server.getUser(this.state.user._id);
        user.password = '';
        this.setState({ user });
      }
      const allGroups = await this.props.server.getGroups();
      this.setState({ allGroups });
      if (this.state.user.groups != null)
        this.updateGroupsToAdd();
    } catch (error) {
      this.setState({ error: error.message });
    }
    if (this.state.user._id == null)
      document.title = "New User";
    else
      document.title = this.state.user.username ?
        "User: " + this.state.user.username: "User";
    if (this.state.user.username === '')
      document.getElementById('username').focus();
  }
  
  componentDidUpdate(prevProps, prevState) {
    if ((this.state.error && !prevState.error) || (this.state.success && !prevState.success))
      document.querySelector('.alert').focus();
  }
  
  updateGroupsToAdd() {
    const groupsToAdd = this.state.allGroups
      .filter((g) => g.name !== 'Guests' && g.name !== 'Authenticated' &&
        !this.state.user.groups.some((g2) => g2._id === g._id));
    this.setState({
      groupsToAdd,
      selectedGroup: groupsToAdd.length === 0 ? '' : groupsToAdd[0]._id
    });
  }
  
  handleUserChange(event) {
    const target = event.target;
    this.setState({
      user: {
        ...this.state.user,
        [target.name]: target.value
      }
    });
  }
  
  handleChange(event) {
    const target = event.target;
    this.setState({
      [target.name]: target.value
    });
  }
  
  async removeUser() {
    try {
      await this.props.server.removeUser(this.state.user._id);
      this.props.history.push('/users/');
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  async saveUser() {
    try {
      let user = null;
      if (this.state.user._id) {
        await this.props.server.updateUser(this.state.user);
      } else {
        user = await this.props.server.createUser(this.state.user);
        user.password = '';
        this.setState({ user });
        this.updateGroupsToAdd();
      }
      this.setState({ success: "The user was successfully saved." });
      document.title = this.state.user.username ?
        "User: " + this.state.user.username: "User";
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  async removeGroup(groupId) {
    try {
      await this.props.server.removeUserGroup(this.state.user._id, groupId);
      const user = await this.props.server.getUser(this.state.user._id);
      user.password = '';
      this.setState({ user });
      this.updateGroupsToAdd();
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  breadcrumbs() {
    return (
      <Breadcrumb>
        <LinkContainer to="/">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </LinkContainer>
        <LinkContainer to="/users">
          <Breadcrumb.Item>Users</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>User</Breadcrumb.Item>
      </Breadcrumb>
    );
  }
  
  userGroupList() {
    if (this.state.user.groups == null)
      return null;
    return this.state.user.groups.map(group => (
      <tr key={group._id}>
        <td className="code"><Link to={'/groups/'+group._id}>{group.name}</Link></td>
        <td className="text-right">
          <Button title="Remove" variant="danger" size="xs"
              onClick={(e) => this.removeGroup(group._id)}>
            <FontAwesomeIcon icon={faTrashAlt} title="Remove" />
          </Button>
        </td>
      </tr>
    ));
  }
  
  async addGroup() {
    try {
      await this.props.server.addUserGroup(this.state.user._id,
        this.state.selectedGroup);
      const user = await this.props.server.getUser(this.state.user._id);
      user.password = '';
      this.setState({ user });
      this.updateGroupsToAdd();
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  render() {
    if (this.props.permissions == null || !this.props.permissions.userAndGroupEditAllowed()) {
      return (
        <>
          {this.breadcrumbs()}
          <h1>User</h1>
          <Alert variant="danger">
            You are not allowed to edit users.
          </Alert>
        </>
      );
    }
    const groupsHTML = this.userGroupList();
    return (
      <>
        {this.breadcrumbs()}
        <h1>{this.state.user._id ? "User: " + this.state.user.username : "New User"}</h1>
        <Alert show={this.state.error != null} variant="danger" dismissible
            onClose={() => this.setState({ error: null })} tabIndex="0">
          {this.state.error}
        </Alert>
        <Alert show={this.state.success != null} variant="success" dismissible
            onClose={() => this.setState({ success: null })} tabIndex="0">
          {this.state.success}
        </Alert>
        {this.state.user._id != null &&
          <Button variant="danger" size="sm" onClick={(e) => this.removeUser()}
              disabled={this.state.user._id === this.props.permissions.user._id}>
            Remove user
          </Button>
        }
        <Container fluid className="px-0"><Row><Col sm="10">
          <Form onSubmit={e => { e.preventDefault(); this.saveUser(); } } className="form mt-3 border">
            <Form.Group as={Row} controlId="username">
              <Form.Label column sm="4">Username</Form.Label>
              <Col sm="8">
                <Form.Control name="username" type="text" size="30" value={this.state.user.username}
                  required onChange={e => this.handleUserChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="firstname">
              <Form.Label column sm="4">Firstname</Form.Label>
              <Col sm="8">
                <Form.Control name="firstname" type="text" size="30" value={this.state.user.firstname}
                  onChange={e => this.handleUserChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="lastname">
              <Form.Label column sm="4">Lastname</Form.Label>
              <Col sm="8">
                <Form.Control name="lastname" type="text" size="30" value={this.state.user.lastname}
                  onChange={e => this.handleUserChange(e)}/>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="password">
              <Form.Label column sm="4">Password</Form.Label>
              <Col sm="8">
                <Form.Control name="password" type="password" size="30"
                  value={this.state.user.password}
                  onChange={e => this.handleUserChange(e)}
                  required={this.state.user._id == null}
                />
              </Col>
            </Form.Group>
            <div className="text-center">
              <Button variant="primary" type="submit">
                Save
              </Button>
            </div>
          </Form>
          {groupsHTML &&
            <section className="border">
              <h2>Groups</h2>
              <Table bordered size="sm" className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {groupsHTML}
                </tbody>
              </Table>
              {this.state.groupsToAdd && this.state.groupsToAdd.length > 0 &&
                <Form onSubmit={e => { e.preventDefault(); this.addGroup(); } } inline>
                  <Form.Group controlId="selectedGroup">
                    <Form.Label className="mr-1">Add a group:</Form.Label>
                    <Form.Control name="selectedGroup" as="select" value={this.state.selectedGroup}
                        onChange={e => this.handleChange(e)}>
                      {this.state.groupsToAdd
                        .map((g) => 
                          <option key={g._id} value={g._id}>{g.name}</option>
                        )}
                    </Form.Control>
                  </Form.Group>
                  <Button variant="primary" type="submit" className="ml-2">
                    Add
                  </Button>
                </Form>
              }
            </section>
          }
        </Col></Row></Container>
      </>
    );
  }
  
}

User.propTypes = {
  permissions: PropTypes.instanceOf(Permissions),
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      userId: PropTypes.string, // this initial user id can be undefined for a new user
    })
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
};

export default User;
