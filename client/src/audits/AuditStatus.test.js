import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MockServerAPI from '../ServerAPI';
import AuditStatus from './AuditStatus';

jest.mock('../ServerAPI');

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
  await waitFor(() => expect(mockServer.getAuditStatus).toHaveBeenCalledTimes(1));
  expect(container.querySelector('td').textContent).toBe('Yes');
  expect(mockServer.getAuditStatus).toBeCalledWith('aid1');
});

it("can stop an audit", async () => {
  const mockAudit = JSON.parse(JSON.stringify(initialMockAudit));
  const mockServer = new MockServerAPI();
  mockServer.getAuditStatus = jest.fn().mockImplementation(() => Promise.resolve(mockAudit));
  mockServer.stopAudit = jest.fn().mockImplementation(() => Promise.resolve());

  const { getByText } = render(<MemoryRouter><AuditStatus server={mockServer} match={{params:{auditId:'aid1'}}}/></MemoryRouter>);
  await waitFor(() => expect(mockServer.getAuditStatus).toHaveBeenCalledTimes(1));
  fireEvent.click(getByText("Stop the audit"));
  await waitFor(() => {});
  expect(mockServer.stopAudit).toBeCalledWith('aid1');
});
