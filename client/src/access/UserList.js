import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import ServerAPI from '../ServerAPI';
import Permissions from './Permissions';


class UserList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      users: null,
      error: null,
    };
  }
  
  async componentDidMount() {
    try {
      const users = await this.props.server.getUsers();
      this.setState({ users });
    } catch (error) {
      this.setState({ error: error.message });
    }
    document.title = "Users";
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.error && !prevState.error)
      document.querySelector('.alert').focus();
  }
  
  removeUser(userId) {
    this.props.server.removeUser(userId)
      .then(() => this.props.server.getUsers())
      .then((users) => {
        this.setState({ users });
      })
      .catch((error) => {
        this.setState({ error: "Remove user: " + error });
      });
  }
  
  breadcrumbs() {
    return (
      <Breadcrumb>
        <LinkContainer to="/">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>Users</Breadcrumb.Item>
      </Breadcrumb>
    );
  }
  
  userList() {
    if (this.state.users == null)
      return null;
    return this.state.users.map(user => (
      <tr key={user._id}>
        <td className="code"><Link to={'/users/'+user._id}>{user.username}</Link></td>
        <td className="text-right">{user.firstname}</td>
        <td className="text-right">{user.lastname}</td>
        <td className="text-right">
          <Button title="Remove" variant="danger" size="xs"
              onClick={(e) => this.removeUser(user._id)}
              disabled={user._id === this.props.permissions.user._id}>
            <FontAwesomeIcon icon={faTrashAlt} title="Remove" />
          </Button>
        </td>
      </tr>
    ));
  }
  
  render() {
    if (this.props.permissions == null || !this.props.permissions.userAndGroupEditAllowed()) {
      return (
        <>
          {this.breadcrumbs()}
          <h1>Users</h1>
          <Alert variant="danger">
            You are not allowed to edit users.
          </Alert>
        </>
      );
    }
    const usersHTML = this.userList();
    return (
      <>
        {this.breadcrumbs()}
        <h1>Users</h1>
        <Alert show={this.state.error != null} variant="danger" dismissible
            onClose={() => this.setState({ error: null })} tabIndex="0">
          {this.state.error}
        </Alert>
        <LinkContainer to="/users/create">
          <Button>Create a new user</Button>
        </LinkContainer>
        {usersHTML &&
          <section>
            <h2>Users</h2>
            <Table bordered size="sm" className="data">
              <thead>
                <tr>
                  <th>Username</th>
                  <th className="text-right">Firstname</th>
                  <th className="text-right">Lastname</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {usersHTML}
              </tbody>
            </Table>
          </section>
        }
      </>
    );
  }
  
}

UserList.propTypes = {
  permissions: PropTypes.instanceOf(Permissions),
  server: PropTypes.instanceOf(ServerAPI).isRequired,
};

export default UserList;
