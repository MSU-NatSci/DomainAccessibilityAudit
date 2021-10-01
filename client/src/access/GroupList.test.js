import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MockServerAPI from '../ServerAPI';
import GroupList from './GroupList';
import Permissions from './Permissions';

jest.mock('../ServerAPI');

const init = async (admin) => {
  const mockServer = new MockServerAPI();
  if (admin)
    await mockServer.localLogin('user1', 'pass1');
  const userInfo = await mockServer.getCurrentUser();
  const permissions = new Permissions(userInfo);
  const { container, getByText, getAllByTitle } = render(<MemoryRouter><GroupList server={mockServer} permissions={permissions}/></MemoryRouter>);
  await waitFor(() => {});
  return { container, getByText, getAllByTitle };
};

it("fails without login", async () => {
  const { container, getByText } = await init(false);
  expect(getByText("You are not allowed to edit groups.")).toBeTruthy();
  expect(container.querySelector('table.data')).toBe(null);
});

it("renders with group information", async () => {
  const { container } = await init(true);
  const groupTable = container.querySelector('table.data');
  expect(groupTable.querySelector('tr td').textContent).toBe('group1');
  expect(groupTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('Yes');
});

it("removes a group", async () => {
  const { container, getAllByTitle } = await init(true);
  const groupTable = container.querySelector('table.data');
  const nb1 = groupTable.querySelectorAll('tr').length;
  fireEvent.click(getAllByTitle("Remove")[0]);
  await waitFor(() => {});
  const nb2 = groupTable.querySelectorAll('tr').length;
  expect(nb2).toBe(nb1 - 1);
  expect(groupTable.querySelector('tr td').textContent).toBe('group2');
});
