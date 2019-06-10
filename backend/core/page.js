var AxeBuilder = require('axe-webdriverjs');

import PageModel from '../models/page.model';

export default class Page {
  
  /**
   * Page constructor.
   * @param {Audit} audit
   * @param {Domain} domain
   * @param {string} url
   * @param {number} depth - the current crawl depth
   * @param {string} status - status returned by the HEAD request
   */
  constructor(audit, domain, url, depth, status) {
    /** @member {Audit} */
    this.audit = audit;
    /** @member {Domain} */
    this.domain = domain;
    /** @member {string} */
    this.url = url;
    /** @member {number} */
    this.depth = depth;
    /** @member {string} */
    this.status = status;
    /** @member {string} */
    this.errorMessage = null;
    /** @member {number} - total number of violations found in the page */
    this.nbViolations = 0;
    /** @member {Array.<Object>} - (id, descLink, description, impact, nodes) */
    this.violations = [];
    /** @member {PageModel} - database object for this page */
    this.dbObject = null;
  }
  
  /**
   * Load the page, and calls contentLoaded() or handleError().
   */
  startChecking() {
    console.log("** startChecking " + this.url);
    this.audit.driver.get(this.url).then(
      () => this.contentLoaded(),
      (error) => this.handleError(error)
    );
  }
  
  /**
   * Extract the links and start analyzing the page with aXe.
   * Call aXeResults() when done.
   */
  contentLoaded() {
    console.log("contentLoaded");
    this.audit.extractLinks(this)
    .then(() => {
      console.log("aXe analyze");
      this.audit.aXeB
        .analyze((err, results) => {
          if (err) {
            console.log("aXe analyze error:");
            console.log(err);
            if (this.errorMessage == null)
              this.errorMessage = err;
          }
          this.aXeResults(results);
      });
    });
  }
  
  /**
   * Update the list of violations based on aXe's results,
   * and call saveAndContinue().
   * @param {Object} results
   */
  aXeResults(results) {
    if (results != null) {
      let violations = results.violations;
      this.nbViolations = 0;
      for (let violation of violations) {
        const nodes = [];
        for (let node of violation.nodes) {
          nodes.push({
            target: node.target[0],
            html: node.html
          });
        }
        this.violations.push({
          id: violation.id,
          descLink: violation.helpUrl,
          description: violation.description,
          impact: violation.impact,
          nodes: nodes
        });
        this.nbViolations += nodes.length;
      }
    }
    this.saveAndContinue();
  }
  
  /**
   * Create a new web driver if needed, and call saveAndContinue().
   * @param {Error} error
   */
  async handleError(error) {
    console.log("Error in driver.get (" + error.name + "): ");
    console.log(error);
    this.errorMessage = error.message;
    // name = NoSuchSessionError, message = Tried to run command without establishing a connection
    if (error.name.indexOf('NoSuchSessionError') == 0 ||
        error.name.indexOf('TimeoutError') == 0) // maybe also: WebDriverError
      await this.audit.createNewDriver();
    this.saveAndContinue();
  }
  
  /**
   * Save the page in the database and call audit.continueAudit().
   */
  saveAndContinue() {
    let page = new PageModel({
      auditId: this.audit.dbObject._id,
      domainId: this.domain.dbObject._id,
      url: this.url,
      status: this.status,
      errorMessage: this.errorMessage,
      nbViolations: this.nbViolations,
      violations: this.violations,
    });
    page.save()
      .then((pageObject) => this.dbObject = pageObject)
      .catch((err) => {
        console.log("Error saving the page:");
        console.log(err);
      })
      .finally(() => this.audit.continueAudit(this));
  }
  
}
