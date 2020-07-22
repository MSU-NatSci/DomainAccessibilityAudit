import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';

import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import ServerAPI from '../ServerAPI';
import Permissions from './Permissions';


class Group extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      group: {
        _id: this.props.match.params.groupId,
        name: '',
        permissions: {
          createAllAudits: false,
          readAllAudits: true,
          deleteAllAudits: false,
          editUsersAndGroups: false,
          domains: [/*{
            name: String,
            read: Boolean,
            delete: Boolean,
            create: Boolean,
          }*/],
        },
      },
      error: null,
      success: null,
      allUsers: null,
      usersToAdd: null,
      selectedUser: null,
    };
  }
  
  async componentDidMount() {
    try {
      if (this.state.group._id != null) {
        const group = await this.props.server.getGroup(this.state.group._id);
        this.setState({ group });
      }
      const allUsers = await this.props.server.getUsers();
      this.setState({ allUsers });
      if (this.state.group.users != null)
        this.updateUsersToAdd();
    } catch (error) {
      this.setState({ error: error.message });
    }
    if (this.state.group._id == null)
      document.title = "New Group";
    else
      document.title = this.state.group.name ?
        "Group: " + this.state.group.name: "Group";
    if (this.state.group.name === '')
      document.getElementById('name').focus();
  }
  
  componentDidUpdate(prevProps, prevState) {
    if ((this.state.error && !prevState.error) || (this.state.success && !prevState.success))
      document.querySelector('.alert').focus();
  }
  
  updateUsersToAdd() {
    const usersToAdd = this.state.allUsers
      .filter((u) => !this.state.group.users.some((u2) => u2._id === u._id));
    this.setState({
      usersToAdd,
      selectedUser: usersToAdd.length === 0 ? '' : usersToAdd[0]._id,
    });
  }
  
  handleGroupChange(event) {
    const target = event.target;
    this.setState({
      group: {
        ...this.state.group,
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
  
  handlePermissionChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      group: {
        ...this.state.group,
        permissions: {
          ...this.state.group.permissions,
          [name]: value
        }
      }
    });
  }
  
  handleDomainChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name_parts = target.id.split('_', 3);
    const index = parseInt(name_parts[1]);
    const property = name_parts[2];
    const domains = this.state.group.permissions.domains.map((d, i) => {
      if (i !== index)
        return d;
      return {
        ...d,
        [property]: value,
      };
    });
    this.setState({
      group: {
        ...this.state.group,
        permissions: {
          ...this.state.group.permissions,
          domains: domains,
        }
      }
    });
  }
  
  async removeGroup() {
    try {
      await this.props.server.removeGroup(this.state.group._id);
      this.props.history.push('/groups/');
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  async saveGroup() {
    try {
      let group = null;
      if (this.state.group._id) {
        await this.props.server.updateGroup(this.state.group);
      } else {
        group = await this.props.server.createGroup(this.state.group);
        this.setState({ group });
        this.updateUsersToAdd();
      }
      this.setState({ success: "The group was successfully saved." });
      document.title = this.state.group.name ?
        "Group: " + this.state.group.name: "Group";
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  async removeUser(userId) {
    try {
      await this.props.server.removeGroupUser(this.state.group._id, userId);
      const group = await this.props.server.getGroup(this.state.group._id);
      this.setState({ group });
      this.updateUsersToAdd();
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
        <LinkContainer to="/groups">
          <Breadcrumb.Item>Groups</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>Group</Breadcrumb.Item>
      </Breadcrumb>
    );
  }
  
  groupUserList() {
    if (this.state.group.users == null || this.state.group.name === 'Guests' ||
        this.state.group.name === 'Authenticated')
      return null;
    return this.state.group.users.map(user => (
      <tr key={user._id}>
        <td className="code"><Link to={'/users/'+user._id}>{user.username}</Link></td>
        <td className="text-right">
          <Button title="Remove" variant="danger" size="xs"
              onClick={(e) => this.removeUser(user._id)}>
            <FontAwesomeIcon icon={faTrashAlt} title="Remove" />
          </Button>
        </td>
      </tr>
    ));
  }
  
  async addUser() {
    try {
      await this.props.server.addGroupUser(this.state.group._id,
        this.state.selectedUser);
      const group = await this.props.server.getGroup(this.state.group._id);
      this.setState({ group });
      this.updateUsersToAdd();
    } catch (error) {
      this.setState({ error: error.message });
    }
  }
  
  addDomain() {
    const index = this.state.group.permissions.domains.length;
    this.setState({
      group: {
        ...this.state.group,
        permissions: {
          ...this.state.group.permissions,
          domains: [
            ...this.state.group.permissions.domains,
            {
              name: '',
              create: false,
              read: true,
              delete: false,
            }
          ]
        }
      }
    },
    () => document.querySelector(`input[id='domain_${index}_name']`).focus()
    );
  }
  
  removeDomain(index) {
    this.setState({
      group: {
        ...this.state.group,
        permissions: {
          ...this.state.group.permissions,
          domains: this.state.group.permissions.domains.filter((d, i) => i !== index),
        }
      }
    });
  }
  
  render() {
    if (this.props.permissions == null || !this.props.permissions.userAndGroupEditAllowed()) {
      return (
        <>
          {this.breadcrumbs()}
          <h1>Group</h1>
          <Alert variant="danger">
            You are not allowed to edit groups.
          </Alert>
        </>
      );
    }
    const usersHTML = this.groupUserList();
    return (
      <>
        {this.breadcrumbs()}
        <h1>{this.state.group._id ? "Group: " + this.state.group.name : "New Group"}</h1>
        <Alert show={this.state.error != null} variant="danger" dismissible
            onClose={() => this.setState({ error: null })} tabIndex="0">
          {this.state.error}
        </Alert>
        <Alert show={this.state.success != null} variant="success" dismissible
            onClose={() => this.setState({ success: null })} tabIndex="0">
          {this.state.success}
        </Alert>
        {this.state.group._id != null &&
          <Button title="Remove" variant="danger" size="sm" onClick={(e) => this.removeGroup()}>Remove group</Button>
        }
        <Form onSubmit={e => { e.preventDefault(); this.saveGroup(); } } className="form mt-3 border">
          <Form.Group controlId="name">
            <Form.Label>Group Name</Form.Label>
            <Form.Control name="name" type="text" size="30"
              value={this.state.group.name} style={{ width:'auto' }}
              required onChange={e => this.handleGroupChange(e)}/>
          </Form.Group>
          <Form.Group controlId="createAllAudits">
            <Form.Check name="createAllAudits" type="checkbox"
              value={this.state.group.permissions.createAllAudits}
              onChange={e => this.handlePermissionChange(e)}
              checked={this.state.group.permissions.createAllAudits}
              label="Create any audit"/>
          </Form.Group>
          <Form.Group controlId="readAllAudits">
            <Form.Check name="readAllAudits" type="checkbox"
              value={this.state.group.permissions.readAllAudits}
              onChange={e => this.handlePermissionChange(e)}
              checked={this.state.group.permissions.readAllAudits}
              label="Read all audits"/>
          </Form.Group>
          <Form.Group controlId="deleteAllAudits">
            <Form.Check name="deleteAllAudits" type="checkbox"
              value={this.state.group.permissions.deleteAllAudits}
              onChange={e => this.handlePermissionChange(e)}
              checked={this.state.group.permissions.deleteAllAudits}
              disabled={this.state.group.name === 'Guests'}
              label="Delete all audits"/>
          </Form.Group>
          <Form.Group controlId="editUsersAndGroups">
            <Form.Check name="editUsersAndGroups" type="checkbox"
              value={this.state.group.permissions.editUsersAndGroups}
              onChange={e => this.handlePermissionChange(e)}
              checked={this.state.group.permissions.editUsersAndGroups}
              disabled={this.state.group.name === 'Guests'}
              label="Edit users and groups"/>
          </Form.Group>
          <section className="mt-4">
            <h2>Domains</h2>
            {this.state.group.permissions.domains.length > 0 ?
              <Table id="domains" bordered size="sm" className="data">
                <thead>
                  <tr><th id="dname">Domain Name</th><th>Create</th><th>Read</th><th>Delete</th><th></th></tr>
                </thead>
                <tbody>
                  {this.state.group.permissions.domains.map((d, index) =>
                    <tr key={index}>
                      <td><Form.Control id={`domain_${index}_name`} type="text"
                        size="30" value={d.name} required aria-labelledby="dname"
                        onChange={e => this.handleDomainChange(e)}/></td>
                      <td><Form.Check id={`domain_${index}_create`} type="checkbox"
                        value={d.create} onChange={e => this.handleDomainChange(e)}
                        checked={d.create} label="Create"/></td>
                      <td><Form.Check id={`domain_${index}_read`} type="checkbox"
                        value={d.read} onChange={e => this.handleDomainChange(e)}
                        checked={d.read} label="Read"/></td>
                      <td><Form.Check id={`domain_${index}_delete`} type="checkbox"
                        value={d.delete} onChange={e => this.handleDomainChange(e)}
                        checked={d.delete} label="Delete"/></td>
                      <td><Button title="Remove" variant="danger" size="xs"
                        onClick={(e) => this.removeDomain(index)}>
                        <FontAwesomeIcon icon={faTrashAlt} title="Remove" />
                      </Button></td>
                    </tr>
                  )}
                </tbody>
              </Table>
              :
              <p>No domain-specific rule.</p>
            }
            <Button variant="secondary" size="sm" className="ml-2"
                onClick={e => this.addDomain()}>
              Add a domain
            </Button>
          </section>
          <div className="text-center">
            <Button variant="primary" type="submit">
              Save
            </Button>
          </div>
        </Form>
        {usersHTML &&
          <section className="border">
            <h2>Users</h2>
            <Table bordered size="sm" className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {usersHTML}
              </tbody>
            </Table>
            {this.state.usersToAdd && this.state.usersToAdd.length > 0 &&
              <Form onSubmit={e => { e.preventDefault(); this.addUser(); } } inline>
                <Form.Group controlId="selectedUser">
                  <Form.Label className="mr-1">Add a user:</Form.Label>
                  <Form.Control name="selectedUser" as="select" value={this.state.selectedUser}
                      onChange={e => this.handleChange(e)}>
                    {this.state.usersToAdd
                      .map((u) =>
                        <option key={u._id} value={u._id}>{u.username}</option>
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
      </>
    );
  }
  
}

Group.propTypes = {
  permissions: PropTypes.instanceOf(Permissions),
  server: PropTypes.instanceOf(ServerAPI).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.string, // this initial group id can be undefined for a new group
    })
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
};

export default Group;
