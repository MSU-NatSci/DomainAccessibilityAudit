import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import PageTable from './PageTable';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

it("renders with page information", async () => {
  let domain = await (new MockServerAPI()).getDomain('did1');
  const { container } = render(<MemoryRouter><PageTable domain={domain}/></MemoryRouter>);
  let tr2 = container.querySelector('tr:nth-of-type(2)');
  let td1 = tr2.querySelector('td:nth-of-type(1)');
  let a = td1.querySelector('a');
  expect(a.textContent).toBe('purl2');
  expect(a.getAttribute('href')).toBe('/pages/pid2');
  let td2 = tr2.querySelector('td:nth-of-type(2)');
  expect(td2.textContent).toBe('nbViolations2');
});
