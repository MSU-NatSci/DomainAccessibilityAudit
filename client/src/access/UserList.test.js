import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MockServerAPI from '../ServerAPI';
import Permissions from './Permissions';
import UserList from './UserList';

jest.mock('../ServerAPI');

const init = async (admin) => {
  const mockServer = new MockServerAPI();
  if (admin)
    await mockServer.localLogin('user1', 'pass1');
  const userInfo = await mockServer.getCurrentUser();
  const permissions = new Permissions(userInfo);
  const { container, getByText } = render(<MemoryRouter><UserList server={mockServer} permissions={permissions}/></MemoryRouter>);
  await wait();
  return { container, getByText };
};

it("fails without login", async () => {
  const { container, getByText } = await init(false);
  expect(getByText("You are not allowed to edit users.")).toBeTruthy();
  expect(container.querySelector('table.data')).toBe(null);
});

it("renders with user information", async () => {
  const { container } = await init(true);
  const userTable = container.querySelector('table.data');
  expect(userTable.querySelector('tr td').textContent).toBe('user1');
  expect(userTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('first1');
});

it("removes a user", async () => {
  const { container } = await init(true);
  const userTable = container.querySelector('table.data');
  const nb1 = userTable.querySelectorAll('tr').length;
  fireEvent.click(container.querySelectorAll('button[title="Remove"]')[1]);
  await wait();
  const nb2 = userTable.querySelectorAll('tr').length;
  expect(nb2).toBe(nb1 - 1);
  expect(userTable.querySelector('tr:nth-of-type(2) td').textContent).toBe('guest');
});
