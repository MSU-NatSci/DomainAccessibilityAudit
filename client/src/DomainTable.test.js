import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DomainTable from './DomainTable';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

it("renders with domain information", async () => {
  const audit = await (new MockServerAPI()).getAudit('aid1');
  const { container } = render(<MemoryRouter><DomainTable audit={audit}/></MemoryRouter>);
  const tr2 = container.querySelector('tr:nth-of-type(2)');
  const td1 = tr2.querySelector('td:nth-of-type(1)');
  const a = td1.querySelector('a');
  expect(a.textContent).toBe('domain2');
  expect(a.getAttribute('href')).toBe('/domains/did2');
  const td2 = tr2.querySelector('td:nth-of-type(2)');
  expect(td2.textContent).toBe('nbCheckedURLs2');
  const td3 = tr2.querySelector('td:nth-of-type(3)');
  expect(td3.textContent).toBe('nbViolations2');
});
