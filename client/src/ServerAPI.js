
class ServerAPI {
  
  constructor() {
    this.cache = {
      lastAuditList: null,
      lastAudit: null,
      lastDomain: null,
      lastPage: null,
    };
    const protocol = window.location.protocol;
    let port;
    if (process.env.REACT_APP_NODE_ENV === 'production')
      port = process.env.REACT_APP_PRODUCTION_PORT;
    else
      port = process.env.REACT_APP_DEVELOPMENT_API_PORT;
    const portString = (protocol === 'https:' || port === '80') ? '' : ':' + port;
    this.hostURL = protocol + '//' + window.location.hostname + portString;
  }
  
  request(method, path, parameters) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const fetchParams = {
        method: method,
        signal: controller.signal
      };
      if (parameters != null) {
        fetchParams.headers = { 'Content-Type': 'application/json' };
        if (parameters instanceof ArrayBuffer) {
          let isCompressed = false;
          const ar = new Uint8Array(parameters);
          if (ar[0] === 0x1F && ar[1] === 0x8B && ar[2] === 0x08)
            isCompressed = true;
          if (isCompressed)
            fetchParams.headers['Content-Encoding'] = 'gzip';
          fetchParams.body = parameters;
        } else if (typeof parameters === 'string') {
          fetchParams.body = parameters;
        } else {
          fetchParams.body = JSON.stringify(parameters);
        }
      }
      fetch(path, fetchParams)
        .then((response) => {
          if (!response.ok)
            reject(new Error(response.statusText));
          return response;
        })
        .then(data => data.json())
        .then((res) => {
          if (!res.success)
            reject(new Error(res.error));
          else
            resolve(res.data);
        })
        .catch(error => {
          if (error.name === 'AbortError')
            reject(new Error("Timeout when connecting to server (" +
              error.message + ")"));
          else
            reject(new Error("Error retrieving data: " + error.message));
        })
        .finally(() => clearTimeout(timeout));
    });
  }
  
  // App
  async localLogin(username, password) {
    const user = await this.request('POST', '/api/app/login', { username, password });
    this.cache = {
      lastAuditList: null,
      lastAudit: null,
      lastDomain: null,
      lastPage: null,
    };
    return user;
  }
  samlLogin() {
    window.location.href = this.hostURL + '/api/app/login/saml';
  }
  async logout() {
    await this.request('POST', '/api/app/logout');
    this.cache = {
      lastAuditList: null,
      lastAudit: null,
      lastDomain: null,
      lastPage: null,
    };
  }
  
  // Audit
  getAuditStatus(auditId) {
    return this.request('GET', `/api/audits/${auditId}/status`);
  }
  startAudit(params) {
    this.cache.lastAuditList = null;
    return this.request('POST', '/api/audits/start', params);
  }
  stopAudit(auditId) {
    return this.request('POST', `/api/audits/${auditId}/stop`);
  }
  
  // Results
  async getAudits() {
    if (this.cache.lastAuditList != null)
      return this.cache.lastAuditList;
    const auditList = await this.request('GET', '/api/audits/');
    this.cache.lastAuditList = auditList;
    return auditList;
  }
  async getAudit(auditId) {
    if (this.cache.lastAudit != null && this.cache.lastAudit._id === auditId)
      return this.cache.lastAudit;
    const audit = await this.request('GET', `/api/audits/${auditId}`);
    this.cache.lastAudit = audit;
    return audit;
  }
  removeAudit(auditId) {
    this.cache.lastAuditList = null;
    return this.request('DELETE', `/api/audits/${auditId}`);
  }
  exportAudit(auditId) {
    window.location.href = this.hostURL + `/api/audits/${auditId}/export`;
  }
  async importAudit(data) {
    this.cache.lastAuditList = null;
    await this.request('POST', `/api/audits/import`, data);
  }
  async getDomain(domainId) {
    if (this.cache.lastDomain != null && this.cache.lastDomain._id === domainId)
      return this.cache.lastDomain;
    const domain = await this.request('GET', `/api/domains/${domainId}`);
    this.cache.lastDomain = domain;
    return domain;
  }
  /*getDomainPages(domainId) {
    return this.request('GET', `/api/domains/${domainId}/pages`);
  }*/
  async getPage(pageId) {
    if (this.cache.lastPage != null && this.cache.lastPage._id === pageId)
      return this.cache.lastPage;
    const page = await this.request('GET', `/api/pages/${pageId}`);
    this.cache.lastPage = page;
    return page;
  }
  
  getUsers() {
    return this.request('GET', '/api/users/');
  }
  createUser(user) {
    return this.request('POST', `/api/users/`, user);
  }
  getUser(userId) {
    return this.request('GET', `/api/users/${userId}`);
  }
  removeUser(userId) {
    return this.request('DELETE', `/api/users/${userId}`);
  }
  updateUser(user) {
    return this.request('PUT', `/api/users/${user._id}`, user);
  }
  addUserGroup(userId, groupId) {
    return this.request('PUT', `/api/users/${userId}/groups/${groupId}`);
  }
  removeUserGroup(userId, groupId) {
    return this.request('DELETE', `/api/users/${userId}/groups/${groupId}`);
  }
  getCurrentUser() {
    return this.request('GET', '/api/users/current');
  }
  
  getGroups() {
    return this.request('GET', '/api/groups/');
  }
  createGroup(group) {
    return this.request('POST', `/api/groups/`, group);
  }
  getGroup(groupId) {
    return this.request('GET', `/api/groups/${groupId}`);
  }
  removeGroup(groupId) {
    return this.request('DELETE', `/api/groups/${groupId}`);
  }
  updateGroup(group) {
    return this.request('PUT', `/api/groups/${group._id}`, group);
  }
  addGroupUser(groupId, userId) {
    return this.request('PUT', `/api/groups/${groupId}/users/${userId}`);
  }
  removeGroupUser(groupId, userId) {
    return this.request('DELETE', `/api/groups/${groupId}/users/${userId}`);
  }
  
}

export default ServerAPI;
