import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MockServerAPI from '../ServerAPI';
import ViolationStats from './ViolationStats';

jest.mock('../ServerAPI');

it("renders with stats (audit)", async () => {
  const mockServer = new MockServerAPI();
  await mockServer.localLogin('user2', 'pass2');
  const audit = await mockServer.getAudit('aid1');
  const { container } = render(<MemoryRouter>
    <ViolationStats stats={audit.violationStats}
      items={audit.domains} itemType="domain"/>
  </MemoryRouter>);
  expect(container.querySelector('tr td').textContent).toContain('description1');
  expect(container.querySelector('tr td:nth-of-type(2)').textContent).toBe('impact1');
  expect(container.querySelector('tr td:nth-of-type(3)').textContent).toBe('total1');
});

it("expands violation items with a button (audit)", async () => {
  const mockServer = new MockServerAPI();
  const audit = await mockServer.getAudit('aid1');
  const { container, getAllByTitle } = render(<MemoryRouter>
    <ViolationStats stats={audit.violationStats}
      items={audit.domains} itemType="domain"/>
  </MemoryRouter>);
  expect(container.querySelector('.violationItems')).toBe(null);
  fireEvent.click(getAllByTitle("See affected domains")[0]);
  expect(container.querySelector('.violationItems div a').textContent).toBe('domain1');
});

it("expands violation items with a button (domain)", async () => {
  const mockServer = new MockServerAPI();
  const domain = await mockServer.getDomain('did1');
  const { container, getAllByTitle } = render(<MemoryRouter>
    <ViolationStats stats={domain.violationStats}
      items={domain.pages} itemType="page"/>
  </MemoryRouter>);
  expect(container.querySelector('.violationItems')).toBe(null);
  fireEvent.click(getAllByTitle("See affected pages")[0]);
  expect(container.querySelector('.violationItems div a').textContent).toBe('purl1');
});
