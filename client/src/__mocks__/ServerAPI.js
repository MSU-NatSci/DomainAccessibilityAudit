
const initialAudits = {
  aid1: { // audit with 2 domains
    _id: 'aid1',
    id: 'aid1',
    firstURL: 'firstURL1',
    standard: 'wcag2aa',
    checkSubdomains: true,
    maxDepth: 'maxDepth',
    maxPagesPerDomain: 'maxPagesPerDomain',
    sitemaps: true,
    includeMatch: 'includeMatch',
    browser: 'browser',
    postLoadingDelay: 'postLoadingDelay',
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
    categories: {
      'aria': 5,
      'color': 10,
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
    standard: 'wcag2aa',
    checkSubdomains: false,
    maxDepth: 'maxDepth',
    maxPagesPerDomain: 'maxPagesPerDomain',
    sitemaps: true,
    includeMatch: 'includeMatch',
    browser: 'browser',
    postLoadingDelay: 'postLoadingDelay',
    dateStarted: new Date('2019-08-27T13:00:00'),
    dateEnded: new Date('2019-08-27T13:30:00'),
    nbCheckedURLs: 'nbCheckedURLs',
    nbViolations: 'nbViolations',
    nbScanErrors: 'nbScanErrors',
    initialDomainName: 'initialDomainName2',
    violationStats: {
    },
    categories: {
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
    categories: {
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
    categories: {
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
    categories: {
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

const initialUsers = {
  'uid1': {
    _id: 'uid1',
    username: 'user1',
    firstname: 'first1',
    lastname: 'last1',
  },
  'uid2': {
    _id: 'uid2',
    username: 'user2',
    firstname: 'first2',
    lastname: 'last2',
  },
  'guest': {
    _id: 'guest',
    username: 'guest',
    firstname: '',
    lastname: '',
  }
};

const initialGroups = {
  'gid1': {
    _id: 'gid1',
    name: 'group1',
    permissions: {
      createAllAudits: true,
      readAllAudits: true,
      deleteAllAudits: true,
      editUsersAndGroups: true,
      domains: [],
    },
    users: [initialUsers.uid1],
  },
  'gid2': {
    _id: 'gid2',
    name: 'group2',
    permissions: {
      createAllAudits: false,
      readAllAudits: true,
      deleteAllAudits: false,
      editUsersAndGroups: false,
      domains: [{
        name: 'natsci.msu.edu',
        read: true,
        delete: true,
        create: true,
      }],
    },
    users: [initialUsers.uid2],
  },
  'guests': {
    _id: 'guests',
    name: 'Guests',
    permissions: {
      createAllAudits: false,
      readAllAudits: false,
      deleteAllAudits: false,
      editUsersAndGroups: false,
      domains: [],
    },
    users: [],
  }
};

initialUsers.uid1.groups = [initialGroups.gid1];
initialUsers.uid2.groups = [initialGroups.gid2];
initialUsers.guest.groups = [initialGroups.guests];


class ServerAPI {
  constructor() {
    this.audits = initialAudits;
    this.domains = initialDomains;
    this.pages = initialPages;
    this.users = initialUsers;
    this.groups = initialGroups;
    this.currentUser = initialUsers.guest;
  }
  localLogin(username, password) {
    for (const u of Object.values(this.users)) {
      if (u.username === username) {
        this.currentUser = u;
        return Promise.resolve(u);
      }
    }
    return Promise.reject(new Error("Unknown user"));
  }
  logout() {
    this.currentUser = initialUsers.guest;
  }
  startAudit(params) {
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
      throw new Error("removeAudit: " + auditId + " does not exist");
    delete this.audits[auditId];
    return Promise.resolve();
  }
  
  getDomain(domainId) {
    return Promise.resolve(this.domains[domainId]);
  }
  getPage(pageId) {
    return Promise.resolve(this.pages[pageId]);
  }
  
  getUsers() {
    return Promise.resolve(Object.values(this.users));
  }
  createUser(user) {
    user = Object.assign({}, user);
    user._id = Math.floor(Math.random() * 10000);
    this.users[user._id] = user;
    return Promise.resolve();
  }
  getUser(userId) {
    return Promise.resolve(this.users[userId]);
  }
  removeUser(userId) {
    if (this.users[userId] === undefined)
      throw new Error("removeUser: " + userId + " does not exist");
    delete this.users[userId];
    return Promise.resolve();
  }
  updateUser(user) {
    this.users[user._id] = Object.assign({}, user);
    return Promise.resolve();
  }
  addUserGroup(userId, groupId) {
    this.users[userId].groups.push(this.groups[groupId]);
    return Promise.resolve();
  }
  removeUserGroup(userId, groupId) {
    this.users[userId].groups = this.users[userId].groups.filter((g) => g._id !== groupId);
    return Promise.resolve();
  }
  getCurrentUser() {
    return Promise.resolve({
      authenticationMethod: 'local',
      user: this.currentUser,
    });
  }
  
  getGroups() {
    return Promise.resolve(Object.values(this.groups));
  }
  createGroup(group) {
    group = Object.assign({}, group);
    group._id = Math.floor(Math.random() * 10000);
    this.groups[group._id] = group;
    return Promise.resolve();
  }
  getGroup(groupId) {
    return Promise.resolve(this.groups[groupId]);
  }
  removeGroup(groupId) {
    if (this.groups[groupId] === undefined)
      throw new Error("removeGroup: " + groupId + " does not exist");
    delete this.groups[groupId];
    return Promise.resolve();
  }
  updateGroup(group) {
    this.groups[group._id] = Object.assign({}, group);
    return Promise.resolve();
  }
  addGroupUser(groupId, userId) {
    this.groups[groupId].users.push(this.users[userId]);
    return Promise.resolve();
  }
  removeGroupUser(groupId, userId) {
    delete this.groups[groupId].users[userId];
    this.groups[groupId].users = this.groups[groupId].users.filter((u) => u._id !== userId);
    return Promise.resolve();
  }
}

export default ServerAPI;
