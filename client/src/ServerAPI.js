
class ServerAPI {
  
  constructor() {
    this.cache = {
      lastAuditList: null,
      lastAudit: null,
      lastDomain: null,
      lastPage: null,
    };
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
            reject(response.statusText);
          return response;
        })
        .then(data => data.json())
        .then((res) => {
          if (!res.success)
            reject(res.error);
          else
            resolve(res.data);
        })
        .catch(error => {
          if (error.name === 'AbortError')
            reject("Timeout when connecting to server (" +
              error.message + ")");
          else
            reject("Error retrieving data: " + error.message);
        })
        .finally(() => clearTimeout(timeout));
    });
  }
  
  // App
  login(password) {
    return this.request('POST', '/api/app/login', {password});
  }
  logout() {
    return this.request('POST', '/api/app/logout');
  }
  admin() {
    return this.request('GET', '/api/app/admin');
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
  
}

export default ServerAPI;
