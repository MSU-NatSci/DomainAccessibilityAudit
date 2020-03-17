
class ServerAPI {
  
  constructor() {
    this.cache = {
      lastAuditList: null,
      lastAudit: null,
      lastDomain: null,
      lastPage: null,
    };
    let port;
    if (process.env.REACT_APP_NODE_ENV === 'production')
      port = process.env.REACT_APP_PRODUCTION_PORT;
    else
      port = process.env.REACT_APP_DEVELOPMENT_API_PORT;
    this.hostURL = window.location.protocol + '//' +
      window.location.hostname + ':' + port;
  }
  
  request(method, path, parameters) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const fetchParams = {
        method: method,
        signal: controller.signal
      };
      if (parameters != null) {
        fetchParams.headers = { 'Content-Type': 'application/json' };
        fetchParams.body = JSON.stringify(parameters);
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
