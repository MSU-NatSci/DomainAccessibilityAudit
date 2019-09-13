import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import AuditForm from './AuditForm';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

it("starts the audit and navigates to the status page", async () => {
  let mockServer = new MockServerAPI();
  let mockHistory = createMemoryHistory('/audits/create');
  mockHistory.push = jest.fn();
  const { getByText, getByLabelText } = render(
    <MemoryRouter>
      <AuditForm admin={true} server={mockServer} history={mockHistory}/>
    </MemoryRouter>);
  mockServer.startAudit = jest.fn().mockImplementation(() => mockServer.getAudit('aid1'));
  // just change the url
  fireEvent.change(getByLabelText("Initial URL"), { target: { value: 'http://test/' } });
  // click the submit button
  fireEvent.click(getByText("Start Audit"));
  await wait();
  // check startAudit was called
  expect(mockServer.startAudit).toBeCalledWith('http://test/', 'wcag2aa', true, 1, 0, false, '', 'firefox');
  // check AuditStatus will be displayed afterwards
  expect(mockHistory.push).toBeCalledWith('/audits/aid1/status');
});
