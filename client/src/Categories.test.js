import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Categories from './Categories';
import MockServerAPI from './ServerAPI';

jest.mock('./ServerAPI');

it("renders with category information", async () => {
  const audit = await (new MockServerAPI()).getAudit('aid1');
  const { container } = render(<MemoryRouter><Categories categories={audit.categories}/></MemoryRouter>);
  const tr2 = container.querySelector('tr:nth-of-type(2)');
  const td1 = tr2.querySelector('td:nth-of-type(1)');
  expect(td1.textContent).toBe('ARIA');
  const td2 = td1.nextSibling;
  expect(td2.textContent).toBe('5');
  const svg = container.querySelector('svg');
  const firstTitle = svg.querySelector('title');
  expect(firstTitle.textContent).toBe('colors');
});
