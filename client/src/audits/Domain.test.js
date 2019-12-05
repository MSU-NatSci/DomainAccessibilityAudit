import React from 'react';
import { render, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MockServerAPI from '../ServerAPI';
import Domain from './Domain';

jest.mock('../ServerAPI');

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
const init = async (domainId) => {
  const mockServer = new MockServerAPI();
  await mockServer.localLogin('user2', 'pass2');
  const { container, getByText, getAllByTitle } = render(<MemoryRouter><Domain server={mockServer} match={{params:{domainId:domainId}}}/></MemoryRouter>);
  await wait();
  return { container, getByText, getAllByTitle };
};

it("renders with domain information", async () => {
  const { container } = await init('did1');
  // title
  expect(container.querySelector('h1').textContent).toBe('domain1');
  // statistics table
  const parameterTable = getTableBySectionTitle(container, /^STATISTICS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('nbCheckedURLs1');
  expect(parameterTable.querySelector('tr:nth-of-type(2) td').textContent).toBe('nbViolations1');
  // violation table
  const violationTable = getTableBySectionTitle(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description1');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact1');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total1');
  // page table
  const pageTable = getTableBySectionTitle(container, /^SCANNED PAGES/i);
  expect(pageTable.querySelector('tr td').textContent).toBe('purl1');
  expect(pageTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbViolations1');
});
