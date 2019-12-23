import React, { Component } from 'react';

import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { faTrashAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import ServerAPI from '../ServerAPI';
import Permissions from './Permissions';


class GroupList extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      groups: null,
      error: null,
    };
  }
  
  async componentDidMount() {
    try {
      const groups = await this.props.server.getGroups();
      this.setState({ groups });
    } catch (error) {
      this.setState({ error: error.message });
    }
    document.title = "Groups";
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.error && !prevState.error)
      document.querySelector('.alert').focus();
  }
  
  removeGroup(groupId) {
    this.props.server.removeGroup(groupId)
      .then(() => this.props.server.getGroups())
      .then((groups) => {
        this.setState({ groups });
      })
      .catch((error) => {
        this.setState({ error: "Remove group: " + error });
      });
  }
  
  breadcrumbs() {
    return (
      <Breadcrumb>
        <LinkContainer to="/">
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </LinkContainer>
        <Breadcrumb.Item active>Groups</Breadcrumb.Item>
      </Breadcrumb>
    );
  }
  
  groupList() {
    if (this.state.groups == null)
      return null;
    const yesNoIcon = (b) => 
      (b ?
        <FontAwesomeIcon icon={faCheck} title="Yes"/>
        : <FontAwesomeIcon icon={faTimes} title="No"/>
      );
    return this.state.groups.map(group => (
      <tr key={group._id}>
        <td className="code"><Link to={'/groups/'+group._id}>{group.name}</Link></td>
        <td className="text-center">{yesNoIcon(group.permissions.readAllAudits)}</td>
        <td className="text-center">{yesNoIcon(group.permissions.createAllAudits)}</td>
        <td className="text-center">{yesNoIcon(group.permissions.deleteAllAudits)}</td>
        <td className="text-center">{yesNoIcon(group.permissions.editUsersAndGroups)}</td>
        <td className="text-center">{group.permissions.domains.map(d => d.name).join(' ')}</td>
        <td className="text-right">
          <Button title="Remove" variant="danger" size="xs"
              onClick={(e) => this.removeGroup(group._id)}
              disabled={group.name === 'Guests' || group.name === 'Superusers'}>
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
          <h1>Groups</h1>
          <Alert variant="danger">
            You are not allowed to edit groups.
          </Alert>
        </>
      );
    }
    const groupsHTML = this.groupList();
    return (
      <>
        {this.breadcrumbs()}
        <h1>Groups</h1>
        <Alert show={this.state.error != null} variant="danger" dismissible
            onClose={() => this.setState({ error: null })} tabIndex="0">
          {this.state.error}
        </Alert>
        <LinkContainer to="/groups/create">
          <Button>Create a new group</Button>
        </LinkContainer>
        {groupsHTML &&
          <section>
            <h2>Groups</h2>
            <Table bordered size="sm" className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-center">Read all audits</th>
                  <th className="text-center">Create new audits</th>
                  <th className="text-center">Remove all audits</th>
                  <th className="text-center">Edit users and groups</th>
                  <th className="text-center">Domains</th>
                  <th className="text-center"></th>
                </tr>
              </thead>
              <tbody>
                {groupsHTML}
              </tbody>
            </Table>
          </section>
        }
      </>
    );
  }
  
}

GroupList.propTypes = {
  permissions: PropTypes.instanceOf(Permissions),
  server: PropTypes.instanceOf(ServerAPI).isRequired,
};

export default GroupList;
