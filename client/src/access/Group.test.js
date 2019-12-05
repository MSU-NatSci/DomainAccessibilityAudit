import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import MockServerAPI from '../ServerAPI';
import Group from './Group';
import Permissions from './Permissions';

jest.mock('../ServerAPI');
const mockHistory = createMemoryHistory('/groups/gid1');

const getByTagAndContent = (container, tag, expr) => {
  return Array.from(container.querySelectorAll(tag))
    .find(el => expr.test(el.textContent));
};
const getTableBySectionTitle = (container, titleExpr) => {
  const h2 = getByTagAndContent(container, 'h2', titleExpr);
  if (h2 == null)
    throw new Error("h2 " + titleExpr + " not found");
  return h2.parentNode.querySelector('table');
};

const init = async (admin) => {
  const mockServer = new MockServerAPI();
  if (admin)
    await mockServer.localLogin('user1', 'pass1');
  const userInfo = await mockServer.getCurrentUser();
  const permissions = new Permissions(userInfo);
  mockHistory.push = jest.fn();
  const { container, getAllByTitle, getByLabelText, getByText } =
    render(<MemoryRouter><Group server={mockServer} permissions={permissions} match={{params:{groupId:'gid1'}}} history={mockHistory}/></MemoryRouter>);
  await wait();
  return { container, getAllByTitle, getByLabelText, getByText };
};

it("fails without login", async () => {
  const { getByText } = await init(false);
  expect(getByText("You are not allowed to edit groups.")).toBeTruthy();
  expect(document.getElementById('name')).toBe(null);
});

it("renders with group information", async () => {
  await init(true);
  expect(document.getElementById('name').value).toBe('group1');
  expect(document.getElementById('createAllAudits').checked).toBe(true);
});

it("saves modified group information", async () => {
  const { getByText, getByLabelText } = await init(true);
  fireEvent.change(getByLabelText("Group Name"), { target: { value: 'group1-2' } });
  fireEvent.click(getByText("Save"));
  await wait();
  expect(getByText("The group was successfully saved.")).toBeTruthy();
  expect(document.getElementById('name').value).toBe('group1-2');
});

it("adds a domain", async () => {
  const { container, getByText, getByLabelText } = await init(true);
  let table = getTableBySectionTitle(container, /^Domains$/);
  expect(table).toBe(null);
  fireEvent.click(getByText("Add a domain"));
  await wait();
  table = getTableBySectionTitle(container, /^Domains$/);
  expect(table.querySelector('tr td')).toBeTruthy();
  fireEvent.change(getByLabelText("Domain Name"), { target: { value: 'new-domain' } });
  fireEvent.click(getByText("Save"));
  await wait();
});

it("removes a domain", async () => {
  // removes the domain saved in the previous step
  const { container } = await init(true);
  let table = getTableBySectionTitle(container, /^Domains$/);
  fireEvent.click(table.querySelector('button[title="Remove"]'));
  await wait();
  table = getTableBySectionTitle(container, /^Domains$/);
  expect(table).toBe(null);
});

it("adds a user", async () => {
  const { container, getByText } = await init(true);
  const table = getTableBySectionTitle(container, /^Users$/);
  expect(table.querySelector('tr td').textContent).toBe('user1');
  expect(document.getElementById('selectedUser').value).toBe('uid2');
  expect(table.querySelector('tr:nth-of-type(2)')).toBe(null);
  fireEvent.click(getByText("Add"));
  await wait();
  expect(document.getElementById('selectedUser').value).toBe('guest');
  expect(table.querySelector('tr:nth-of-type(2) td').textContent).toBe('user2');
});

it("removes a user", async () => {
  // removes the user added in the previous step
  const { container } = await init(true);
  const table = getTableBySectionTitle(container, /^Users$/);
  fireEvent.click(table.querySelectorAll('button[title="Remove"]')[1]);
  await wait();
  expect(table.querySelector('tr:nth-of-type(2)')).toBe(null);
  expect(document.getElementById('selectedUser').value).toBe('uid2');
});

it("removes a group", async () => {
  const { getByText } = await init(true);
  fireEvent.click(getByText("Remove group"));
  await wait();
  expect(mockHistory.push).toBeCalledWith('/groups/');
});
