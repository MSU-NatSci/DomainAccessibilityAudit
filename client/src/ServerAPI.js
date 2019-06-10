
class ServerAPI {
  
  request(method, path, parameters) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      let fetchParams = {
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
            reject("Timeout when connecting to Site Checker server");
          else
            reject("Error retrieving data: " + error.message);
        })
        .finally(() => clearTimeout(timeout));
    });
  }
  
  // Audit
  getAuditStatus() {
    return this.request('GET', '/api/audits/status');
  }
  
  startAudit(firstURL, standard, checkSubdomains, maxDepth, browser) {
    return this.request('POST', '/api/audits/start',
      {firstURL, standard, checkSubdomains, maxDepth, browser});
  }
  
  stopAudit() {
    return this.request('POST', '/api/audits/stop');
  }
  
  // Results
  getAudits() {
    return this.request('GET', '/api/audits/');
  }
  getAudit(auditId) {
    return this.request('GET', `/api/audits/${auditId}`);
  }
  removeAudit(auditId) {
    return this.request('DELETE', `/api/audits/${auditId}`);
  }
  /*getDomains() {
    return this.request('GET', '/api/domains/');
  }*/
  getDomain(domainId) {
    return this.request('GET', `/api/domains/${domainId}`);
  }
  /*getDomainPages(domainId) {
    return this.request('GET', `/api/domains/${domainId}/pages`);
  }*/
  /*getPages() {
    return this.request('GET', '/api/pages/');
  }*/
  getPage(pageId) {
    return this.request('GET', `/api/pages/${pageId}`);
  }
  
}

export default ServerAPI;
