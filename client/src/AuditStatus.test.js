import React from 'react';
import { render, fireEvent, wait, waitForElement } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AuditStatus from './AuditStatus';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

const initialMockAudit = {
  initialDomainName: 'initialDomainName',
  running: true,
  nbCheckedURLs: 0,
  nbURLsToCheck: 0,
  nbViolations: 0,
  nbScanErrors: 0,
};

it("renders with audit information", async () => {
  const mockAudit = JSON.parse(JSON.stringify(initialMockAudit));
  const mockServer = new MockServerAPI();
  mockServer.getAuditStatus = jest.fn().mockImplementation(() => Promise.resolve(mockAudit));

  const { container } = render(<MemoryRouter><AuditStatus server={mockServer} match={{params:{auditId:'aid1'}}}/></MemoryRouter>);
  // wait for getAuditStatus to be called
  await waitForElement(
    () => container.querySelector('ul'),
    { container }
  );
  expect(mockServer.getAuditStatus).toBeCalledWith('aid1');
});

it("can stop an audit", async () => {
  const mockAudit = JSON.parse(JSON.stringify(initialMockAudit));
  const mockServer = new MockServerAPI();
  mockServer.getAuditStatus = jest.fn().mockImplementation(() => Promise.resolve(mockAudit));
  mockServer.stopAudit = jest.fn().mockImplementation(() => Promise.resolve());

  const { container, getByText } = render(<MemoryRouter><AuditStatus server={mockServer} match={{params:{auditId:'aid1'}}}/></MemoryRouter>);
  await waitForElement(
    () => container.querySelector('ul'),
    { container }
  );
  fireEvent.click(getByText("Stop the audit"));
  await wait();
  expect(mockServer.stopAudit).toBeCalledWith('aid1');
});
