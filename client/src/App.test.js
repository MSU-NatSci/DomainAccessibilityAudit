import React from 'react';
import { render, waitFor } from '@testing-library/react';

import App from './App';

jest.mock('./ServerAPI');

let route = '/';
const history = require('history');
history.createBrowserHistory = () => history.createMemoryHistory({ initialEntries: [route] });
document.title = "A title to avoid oaf-routing warnings";

it("renders without crashing", () => {
  render(<App/>);
});

describe('displays content based on paths', () => {
  it("works with no path", async () => {
    route = '/';
    const { getByText } = render(<App/>);
    await waitFor(() => {});
    expect(getByText("You do not currently have any permission.")).toBeTruthy();
  });
  it("works with an audit path", async () => {
    route = '/audits/aid1';
    const { container } = render(<App/>);
    await waitFor(() => {});
    expect(container.querySelector('h1').textContent).toBe('initialDomainName1');
  });
  it("works with a domain path", async () => {
    route = '/domains/did1';
    const { container } = render(<App/>);
    await waitFor(() => {});
    expect(container.querySelector('h1').textContent).toBe('domain1');
  });
  it("works with a page path", async () => {
    route = '/pages/pid1';
    const { container } = render(<App/>);
    await waitFor(() => {});
    expect(container.querySelector('h1').textContent).toBe('purl1');
  });
  it("works with a user path", async () => {
    route = '/users/uid1';
    const { container } = render(<App/>);
    await waitFor(() => {});
    // NOTE: there will be an error message in the page because we are not logged in.
    expect(container.querySelector('h1').textContent).toBe('User');
  });
  it("works with a group path", async () => {
    route = '/groups/gid1';
    const { container } = render(<App/>);
    await waitFor(() => {});
    expect(container.querySelector('h1').textContent).toBe('Group');
  });
});
