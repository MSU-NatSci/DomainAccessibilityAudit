import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import MockServerAPI from '../ServerAPI';
import Permissions from '../access/Permissions';
import AuditForm from './AuditForm';

jest.mock('../ServerAPI');

it("starts the audit and navigates to the status page", async () => {
  const mockServer = new MockServerAPI();
  mockServer.startAudit = jest.fn().mockImplementation(() => mockServer.getAudit('aid1'));
  await mockServer.localLogin('user1', 'pass1');
  const userInfo = await mockServer.getCurrentUser();
  const permissions = new Permissions(userInfo);
  const mockHistory = createMemoryHistory('/audits/create');
  mockHistory.push = jest.fn();
  const { getByText, getByLabelText } = render(
    <MemoryRouter>
      <AuditForm server={mockServer} permissions={permissions} history={mockHistory}/>
    </MemoryRouter>);
  // just change the url
  fireEvent.change(getByLabelText("Initial URL"), { target: { value: 'http://test/' } });
  // click the submit button
  fireEvent.click(getByText("Start Audit"));
  await wait();
  // check startAudit was called
  expect(mockServer.startAudit).toBeCalledWith({
    firstURL: 'http://test/',
    standard: 'wcag2aa',
    checkSubdomains: true,
    maxDepth: 1,
    maxPagesPerDomain: 0,
    sitemaps: false,
    includeMatch: '',
    browser: 'firefox',
    postLoadingDelay: 0,
  });
  // check AuditStatus will be displayed afterwards
  expect(mockHistory.push).toBeCalledWith('/audits/aid1/status');
});
