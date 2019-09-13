import React from 'react';
import { render, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Domain from './Domain';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

const getByTagAndContent = (container, tag, expr) => {
  return Array.from(container.querySelectorAll(tag))
    .find(el => expr.test(el.textContent));
};
const getTableByCaption = (container, captionExpr) => {
  const caption = getByTagAndContent(container, 'caption', captionExpr);
  if (caption == null)
    throw new Error("caption " + captionExpr + " not found");
  return caption.parentNode;
};
const init = async (domainId) => {
  const mockServer = new MockServerAPI();
  const { container, getByText, getAllByTitle } = render(<MemoryRouter><Domain server={mockServer} match={{params:{domainId:domainId}}}/></MemoryRouter>);
  await wait();
  return { container, getByText, getAllByTitle };
};

it("renders with domain information", async () => {
  const { container } = await init('did1');
  // title
  expect(container.querySelector('h2').textContent).toBe('domain1');
  // statistics table
  const parameterTable = getTableByCaption(container, /^STATISTICS$/i);
  expect(parameterTable.querySelector('tr td').textContent).toBe('nbCheckedURLs1');
  expect(parameterTable.querySelector('tr:nth-of-type(2) td').textContent).toBe('nbViolations1');
  // violation table
  const violationTable = getTableByCaption(container, /^VIOLATIONS$/i);
  expect(violationTable.querySelector('tr td').textContent).toContain('description1');
  expect(violationTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact1');
  expect(violationTable.querySelector('tr td:nth-of-type(3)').textContent).toBe('total1');
  // page table
  const pageTable = getTableByCaption(container, /^SCANNED PAGES/i);
  expect(pageTable.querySelector('tr td').textContent).toBe('purl1');
  expect(pageTable.querySelector('tr td:nth-of-type(2)').textContent).toBe('nbViolations1');
});
