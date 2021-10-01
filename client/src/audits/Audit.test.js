import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Audit from './Audit';
import MockServerAPI from '../ServerAPI';

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
const init = async (auditId) => {
  const mockServer = new MockServerAPI();
  const { container, getByText, getAllByTitle } = render(<MemoryRouter><Audit server={mockServer} match={{params:{auditId:auditId}}}/></MemoryRouter>);
  await waitFor(() => {});
  return { container, getByText, getAllByTitle };
};

it("renders with audit information (2 domains)", async () => {
  const { container } = await init('aid1');
  // title
  expect(container.querySelector('h1').textContent).toBe('initialDomainName1');
  // audit parameters table
  const parameterTable = getTableBySectionTitle(container, /^AUDIT PARAMETERS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('firstURL1');
  expect(parameterTable.querySelector('tr:nth-of-type(3) td').textContent).toBe('Yes');
  // violation table
  const violationTable = getTableBySectionTitle(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description1');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact1');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total1');
  // domain table
  const domainTable = getTableBySectionTitle(container, /^DOMAINS$/i);
  expect(domainTable.querySelector('tr td').textContent).toBe('domain1');
  expect(domainTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbCheckedURLs1');
  expect(domainTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('nbViolations1');
});

it("renders correctly when the audit contains only 1 domain", async () => {
  // in this case, violations and pages come from the domain, not the audit
  const { container } = await init('aid2');
  // title
  expect(container.querySelector('h1 span').textContent).toBe('initialDomainName2');
  // audit parameters table
  const parameterTable = getTableBySectionTitle(container, /^AUDIT PARAMETERS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('firstURL2');
  expect(parameterTable.querySelector('tr:nth-of-type(3) td').textContent).toBe('No');
  // violation table
  const violationTable = getTableBySectionTitle(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description3');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact3');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total3');
  // page table
  const pageTable = getTableBySectionTitle(container, /^SCANNED PAGES/i);
  expect(pageTable.querySelector('tr td').textContent).toBe('purl3');
  expect(pageTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbViolations3');
});
