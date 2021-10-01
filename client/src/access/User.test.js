import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import MockServerAPI from '../ServerAPI';
import Permissions from './Permissions';
import User from './User';

jest.mock('../ServerAPI');
const mockHistory = createMemoryHistory('/users/uid1');

const init = async (admin) => {
  const mockServer = new MockServerAPI();
  if (admin)
    await mockServer.localLogin('user1', 'pass1');
  const userInfo = await mockServer.getCurrentUser();
  const permissions = new Permissions(userInfo);
  mockHistory.push = jest.fn();
  const { container, getAllByTitle, getByLabelText, getByText } =
    render(<MemoryRouter><User server={mockServer} permissions={permissions} match={{params:{userId:'uid2'}}} history={mockHistory}/></MemoryRouter>);
  await waitFor(() => {});
  return { container, getAllByTitle, getByLabelText, getByText };
};

it("fails without login", async () => {
  const { getByText } = await init(false);
  expect(getByText("You are not allowed to edit users.")).toBeTruthy();
  expect(document.getElementById('username')).toBe(null);
});

it("renders with user information", async () => {
  await init(true);
  expect(document.getElementById('username').value).toBe('user2');
  expect(document.getElementById('firstname').value).toBe('first2');
});

it("saves modified user information", async () => {
  const { getByText, getByLabelText } = await init(true);
  fireEvent.change(getByLabelText("Firstname"), { target: { value: 'first2-2' } });
  fireEvent.click(getByText("Save"));
  await waitFor(() => {});
  expect(getByText("The user was successfully saved.")).toBeTruthy();
  expect(document.getElementById('firstname').value).toBe('first2-2');
});

it("adds a group", async () => {
  const { container, getByText } = await init(true);
  expect(container.querySelector('table.data tr td').textContent).toBe('group2');
  expect(document.getElementById('selectedGroup').value).toBe('gid1');
  expect(container.querySelector('table.data tr:nth-of-type(2)')).toBe(null);
  fireEvent.click(getByText("Add"));
  await waitFor(() => {});
  expect(document.getElementById('selectedGroup')).toBe(null);
  expect(container.querySelector('table.data tr:nth-of-type(2) td').textContent).toBe('group1');
});

it("removes a group", async () => {
  // removes the user added in the previous step
  const { container } = await init(true);
  fireEvent.click(container.querySelectorAll('table button[title="Remove"]')[1]);
  await waitFor(() => {});
  expect(container.querySelector('table.data tr:nth-of-type(2)')).toBe(null);
  expect(document.getElementById('selectedGroup').value).toBe('gid1');
});

it("removes a user", async () => {
  const { getByText } = await init(true);
  fireEvent.click(getByText("Remove user"));
  await waitFor(() => {});
  expect(mockHistory.push).toBeCalledWith('/users/');
});
