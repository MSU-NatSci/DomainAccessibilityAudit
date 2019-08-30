import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Audit from './Audit';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

let getByTagAndContent = (container, tag, expr) => {
  return Array.from(container.querySelectorAll(tag))
    .find(el => expr.test(el.textContent));
}
let getTableByCaption = (container, captionExpr) => {
  let caption = getByTagAndContent(container, 'caption', captionExpr);
  if (caption == null)
    throw "caption " + captionExpr + " not found";
  return caption.parentNode;
}
let init = async (auditId) => {
  let mockServer = new MockServerAPI();
  const { container, getByText, getAllByTitle } = render(<MemoryRouter><Audit server={mockServer} match={{params:{auditId:auditId}}}/></MemoryRouter>);
  await wait();
  return { container, getByText, getAllByTitle };
}

it("renders with audit information (2 domains)", async () => {
  const { container, getByText } = await init('aid1');
  // title
  expect(container.querySelector('h2').textContent).toBe('initialDomainName1');
  // audit parameters table
  let parameterTable = getTableByCaption(container, /^AUDIT PARAMETERS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('firstURL1');
  expect(parameterTable.querySelector('tr:nth-of-type(2) td').textContent).toBe('Yes');
  // violation table
  let violationTable = getTableByCaption(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description1');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact1');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total1');
  // domain table
  let domainTable = getTableByCaption(container, /^DOMAINS$/i);
  expect(domainTable.querySelector('tr td').textContent).toBe('domain1');
  expect(domainTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbCheckedURLs1');
  expect(domainTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('nbViolations1');
});

it("renders correctly when the audit contains only 1 domain", async () => {
  // in this case, violations and pages come from the domain, not the audit
  const { container, getByText } = await init('aid2');
  // title
  expect(container.querySelector('h2 span').textContent).toBe('initialDomainName2');
  // audit parameters table
  let parameterTable = getTableByCaption(container, /^AUDIT PARAMETERS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('firstURL2');
  expect(parameterTable.querySelector('tr:nth-of-type(2) td').textContent).toBe('No');
  // violation table
  let violationTable = getTableByCaption(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description3');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact3');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total3');
  // page table
  let pageTable = getTableByCaption(container, /^SCANNED PAGES/i);
  expect(pageTable.querySelector('tr td').textContent).toBe('purl3');
  expect(pageTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbViolations3');
});
