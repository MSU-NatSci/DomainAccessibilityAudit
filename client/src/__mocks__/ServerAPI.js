
const initialAudits = {
  aid1: { // audit with 2 domains
    _id: 'aid1',
    id: 'aid1',
    firstURL: 'firstURL1',
    standard: 'standard',
    checkSubdomains: true,
    maxDepth: 'maxDepth',
    maxPagesPerDomain: 'maxPagesPerDomain',
    sitemaps: true,
    includeMatch: 'includeMatch',
    browser: 'browser',
    dateStarted: new Date('2019-08-27T13:00:00'),
    dateEnded: new Date('2019-08-27T13:30:00'),
    nbCheckedURLs: 'nbCheckedURLs',
    nbViolations: 'nbViolations',
    nbScanErrors: 'nbScanErrors',
    initialDomainName: 'initialDomainName1',
    violationStats: {
      'vid1': {
        description: 'description1',
        descLink: 'descLink1',
        impact: 'impact1',
        total: 'total1',
        domains: [
          {
            id: 'did1',
            count: 'dcount1',
          },
          {
            id: 'did2',
            count: 'dcount2',
          },
        ],
      },
      'vid2': {
        description: 'description2',
        descLink: 'descLink2',
        impact: 'impact2',
        total: 'total2',
        domains: [
          {
            id: 'did3',
            count: 'dcount3',
          },
          {
            id: 'did4',
            count: 'dcount4',
          },
        ],
      },
    },
    complete: true,
    domains: [
      {
        _id: 'did1',
        id: 'did1',
        auditId: 'aid1',
        name: 'domain1',
        nbCheckedURLs: 'nbCheckedURLs1',
        nbViolations: 'nbViolations1',
      },
      {
        _id: 'did2',
        id: 'did2',
        auditId: 'aid1',
        name: 'domain2',
        nbCheckedURLs: 'nbCheckedURLs2',
        nbViolations: 'nbViolations2',
      },
    ],
  },
  aid2: { // audit with 1 domain
    _id: 'aid2',
    firstURL: 'firstURL2',
    standard: 'standard',
    checkSubdomains: false,
    maxDepth: 'maxDepth',
    maxPagesPerDomain: 'maxPagesPerDomain',
    sitemaps: true,
    includeMatch: 'includeMatch',
    browser: 'browser',
    dateStarted: new Date('2019-08-27T13:00:00'),
    dateEnded: new Date('2019-08-27T13:30:00'),
    nbCheckedURLs: 'nbCheckedURLs',
    nbViolations: 'nbViolations',
    nbScanErrors: 'nbScanErrors',
    initialDomainName: 'initialDomainName2',
    violationStats: {
    },
    complete: true,
    domains: [
      {
        _id: 'did3',
        id: 'did3',
        auditId: 'aid3',
        name: 'domain3',
      }
    ],
  }
};

const initialDomains = {
  did1: {
    _id: 'did1',
    auditId: 'aid1',
    name: 'domain1',
    nbCheckedURLs: 'nbCheckedURLs1',
    nbViolations: 'nbViolations1',
    violationStats: {
      'vid1': {
        description: 'description1',
        descLink: 'descLink1',
        impact: 'impact1',
        total: 'total1',
        pages: [
          {
            id: 'pid1',
            count: 'pcount1',
          },
          {
            id: 'pid2',
            count: 'pcount2',
          },
        ],
      },
    },
    pages: [
      {
        _id: 'pid1',
        url: 'purl1',
        nbViolations: 'nbViolations1',
      },
      {
        _id: 'pid2',
        url: 'purl2',
        nbViolations: 'nbViolations2',
      },
    ],
  },
  did2: {
    _id: 'did2',
    auditId: 'aid1',
    name: 'domain2',
    nbCheckedURLs: 'nbCheckedURLs2',
    nbViolations: 'nbViolations2',
    violationStats: {
    },
  },
  did3: {
    _id: 'did3',
    auditId: 'aid2',
    name: 'domain3',
    nbCheckedURLs: 'nbCheckedURLs3',
    nbViolations: 'nbViolations3',
    violationStats: {
      'vid3': {
        description: 'description3',
        descLink: 'descLink3',
        impact: 'impact3',
        total: 'total3',
        pages: [
          {
            id: 'pid3',
          },
          {
            id: 'pid4',
          },
        ],
      },
    },
    pages: [
      {
        _id: 'pid3',
        url: 'purl3',
        nbViolations: 'nbViolations3',
      }
    ],
  }
};

const initialPages = {
  'pid1': {
    _id: 'pid1',
    auditId: 'aid1',
    domainId: 'did1',
    url: 'purl1',
    violations: [
      {
        id: 'vid1',
        description: 'description1',
        nodes: [
          {
            _id: 'nid1',
            target: 'target1',
            html: 'html1',
          }
        ],
      },
    ],
  }
};

class ServerAPI {
  constructor() {
    this.audits = initialAudits;
    this.domains = initialDomains;
    this.pages = initialPages;
  }
  admin() {
    return Promise.resolve(false);
  }
  startAudit(firstURL, standard, checkSubdomains, maxDepth,
      maxPagesPerDomain, sitemaps, includeMatch, browser) {
    return Promise.resolve({});
  }
  getAudits() {
    return Promise.resolve(Object.values(this.audits));
  }
  getAudit(auditId) {
    return Promise.resolve(this.audits[auditId]);
  }
  removeAudit(auditId) {
    if (this.audits[auditId] === undefined)
      throw "removeAudit: " + auditId + " does not exist";
    delete this.audits[auditId];
    return Promise.resolve();
  }
  getDomain(domainId) {
    return Promise.resolve(this.domains[domainId]);
  }
  getPage(pageId) {
    return Promise.resolve(this.pages[pageId]);
  }
}

export default ServerAPI;
