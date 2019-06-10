const WebDriver = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');

import fetch from 'node-fetch';
import mongoose from 'mongoose';

import Page from './page';
import Domain from './domain';
import AuditModel from '../models/audit.model';

/**
 * The core package (this class, Domain and Page) contains the audit engine.
 * It crawls websites and uses axe-webdriverjs for accessibility tests.
 * It compiles and saves statistics in the database.
 */
export default class Audit {
  
  /**
   * This constructor creates an instance of the main engine class.
   */
  constructor() {
    /** @member {boolean} - true when this audit is running */
    this.running = false;
    /** @member {WebDriver} - Selenium WebDriver instance */
    this.driver = null;
    /** @member {AxeBuilder} - axe-webdriverjs's builder instance */
    this.aXeB = null;
    /** @member {boolean} - true when the user has requested to stop the audit */
    this.stopRequested = false;
    /** @member {number} - number of violations found so far */
    this.nbViolations = 0;
    /** @member {string} - domain extracted from the initial URL */
    this.initialDomainName = null;
    /** @member {Array.<Domain>} - domains objects */
    this.domains = [];
    /** @member {Array.<string>} - URLs that have been tested for inclusions */
    this.testedURLs = [];
    /** @member {Array.<Object>} - URLs that need to be tested with HEAD before an audit
      (originPage, url, domainName) */
    this.headToDo = [];
    /** @member {Array.<Page>} - pages that will be analyzed with aXe */
    this.pagesToCheck = [];
    /** @member {Array.<string>} - URLs that have been analyzed with aXe */
    this.checkedURLs = [];
    /** @member {number} - maximum crawling depth */
    this.maxDepth = 0;
    /** @member {string} - web browser name (firefox|chrome) */
    this.browser = 'firefox';
    /** @member {AuditModel} - database object for this audit */
    this.dbObject = null;
    /** @member {boolean} - true when there are HEAD tests being performed
      (there is an async queue for that) */
    this.headTestsRunning = false;
  }
  
  /**
   * Start the audit.
   * @param {string} firstURL - user's initial URL
   * @param {string} standard - accessibility standard to use with aXe
      (wcag2a|wcag2aa|wcag21aa|section508)
   * @param {boolean} checkSubdomains - true if subdomains are to be checked
   * @param {number} maxDepth - maximum crawling depth
   * @param {string} browser - web browser name (firefox|chrome)
   * @returns {Promise<Object>} - this.dbObject (database object for this audit)
   */
  async start(firstURL, standard, checkSubdomains, maxDepth, browser) {
    //mongoose.connection.db.dropDatabase(); // DROP THE DB !!!
    this.standard = standard;
    this.checkSubdomains = checkSubdomains;
    this.maxDepth = maxDepth;
    this.browser = browser;
    this.running = true;
    this.initialDomainName = this.extractDomainNameFromURL(firstURL);
    if (this.initialDomainName == null)
      throw new Error("No initial domain name");
    this.testedURLs = [firstURL];
    const audit = new AuditModel({
      firstURL: firstURL,
      standard: standard,
      checkSubdomains: checkSubdomains,
      maxDepth: maxDepth,
      browser: browser,
      dateStarted: new Date(),
      nbCheckedURLs: 0,
      nbViolations: 0,
      nbScanErrors: 0,
      initialDomainName: this.initialDomainName,
      complete: false,
    });
    try {
      this.dbObject = await audit.save();
    } catch (error) {
      console.log("Error saving the audit:");
      console.log(error);
      throw error;
    }
    await this.createNewDriver();
    const initialDomain = await this.findDomain(this.initialDomainName);
    this.pagesToCheck = [
      this.newPage(null, initialDomain, firstURL, null)
    ];
    this.nextURL();
    return this.dbObject;
  }
  
  /**
   * Create a new Selenium WebDriver instance, and also initialize
   * aXe's builder.
   */
  async createNewDriver() {
    console.log('createNewDriver');
    if (this.driver != null)
      await this.driver.close();
    this.driver = new WebDriver.Builder()
      .forBrowser(this.browser)
      .setFirefoxOptions(new firefox.Options().headless())
      .setChromeOptions(new chrome.Options().headless().addArguments(['--no-sandbox']))
      .build();
    this.driver.manage().setTimeouts( { implicit: 10000 } );
    let tags;
    if (this.standard == 'wcag2a')
      tags = ['wcag2a'];
    else if (this.standard == 'wcag21aa')
      tags = ['wcag21aa', 'wcag2a'];
    else if (this.standard == 'section508')
      tags = ['section508'];
    else
      tags = ['wcag2aa', 'wcag2a'];
    this.aXeB = AxeBuilder(this.driver)
      .options({
        branding: {
          application: "Domain Accessibility Audit"
        },
      })
      .withTags(tags);
  }
  
  /**
   * Create a new Page object.
   * @param {Page} originPage - the page where the new one's URL was found
   * @param {Domain} domain - the domain the new page belongs to
   * @param {string} url - the page URL
   * @param {string} status - status returned by the HEAD request
   * @returns {Page}
   */
  newPage(originPage, domain, url, status) {
    console.log("newPage url="+url);
    const depth = (originPage == null ? 0 : originPage.depth + 1);
    return new Page(this, domain, url, depth, status);
  }
  
  /**
   * Request to stop the audit. In practice it will only stop
   * after the current page checking is over.
   */
  stop() {
    this.stopRequested = true;
  }
  
  /**
   * Continue the audit with the new URL to check.
   */
  nextURL() {
    if (this.pagesToCheck.length > 0) {
      const page = this.pagesToCheck.shift();
      page.startChecking();
    } else {
      this.endAudit();
    }
  }
  
  /**
   * Save the stats for the given page and continue the audit.
   * Calls nextURL() or endAudit().
   * @param {Page} page - the page that was just checked
   */
  continueAudit(page) {
    console.log("continueAudit");
    // update domain and audit stats
    let domainObject = page.domain.dbObject;
    domainObject.nbCheckedURLs++;
    for (let violation of page.violations) {
      this.nbViolations += violation.nodes.length;
      this.updateStats('domain', domainObject, page, violation);
      this.updateStats('audit', this.dbObject, page, violation);
    }
    this.checkedURLs.push(page.url);
    this.dbObject.nbCheckedURLs = this.checkedURLs.length;
    if (page.errorMessage != null)
      this.dbObject.nbScanErrors++;
    domainObject.save()
      .catch((err) => {
        console.log("Error saving the domain:");
        console.log(err);
      })
      .then(() => this.dbObject.save())
      .catch((err) => {
        console.log("Error saving the audit:");
        console.log(err);
      })
      .finally(() => {
        // continue or end audit
        if (!this.stopRequested)
          this.nextURL();
        else
          this.endAudit();
      });
  }
  
  /**
   * Update the stats for the audit or the domain.
   * @param {string} objectType - audit|domain
   * @param {Object} object - database object for the audit or domain
   * @param {Page} page - the page that was just checked
   * @param {Object} violation - the violation to add to stats
   */
  updateStats(objectType, object, page, violation) {
    let violationCount = violation.nodes.length;
    let subs, subObj;
    if (objectType == 'domain') {
      subs = 'pages';
      subObj = page.dbObject;
    } else if (objectType == 'audit') {
      subs = 'domains';
      subObj = page.domain.dbObject;
    }
    object.nbViolations += violationCount;
    let vs = object.violationStats.get(violation.id);
    if (vs == null) {
      vs = {
        description: violation.description,
        descLink: violation.descLink,
        impact: violation.impact,
        total: violationCount,
      };
      vs[subs] = subObj ? [{
        id: subObj._id,
        count: violationCount,
      }] : [];
    } else {
      vs.total += violationCount;
      if (subObj != null) {
        let found = false;
        for (let p of vs[subs]) {
          if (p.id == subObj._id) {
            p.count += violationCount;
            found = true;
            break;
          }
        }
        if (!found) {
          vs[subs].push({
            id: subObj._id,
            count: violationCount,
          });
        }
      }
    }
    object.violationStats.set(violation.id, vs);
  }
  
  /**
   * Stop the driver and saves the audit object with updated info.
   * This marks the end of the audit.
   */
  endAudit() {
    console.log("endAudit");
    this.running = false;
    this.driver.quit();
    this.driver = null;
    this.dbObject.complete = true;
    this.dbObject.dateEnded = new Date();
    this.dbObject.save();
  }
  
  /**
   * Extract the domain name from the given absolute URL.
   * Returns null if the URL was not absolute.
   * @param {string} url
   * @returns {string}
   */
  extractDomainNameFromURL(url) {
    // the URL must be absolute
    if (url.indexOf('//') == -1)
      return null;
    //const link = document.createElement('a');
    //link.href = url;
    //return link.host;
    // we can't create an element at this point
    let ind = url.indexOf('//');
    let domainName = url.substring(ind + 2);
    ind = domainName.indexOf('/');
    if (ind > -1)
      domainName = domainName.substring(0, ind);
    ind = domainName.indexOf('?');
    if (ind > -1)
      domainName = domainName.substring(0, ind);
    ind = domainName.indexOf('#');
    if (ind > -1)
      domainName = domainName.substring(0, ind);
    return domainName;
  }
  
  /**
   * Return the matching domain object if it already exists,
   * or creates it first if necessary.
   * @param {string} domainName
   * @returns {Promise<Domain>}
   */
  async findDomain(domainName) {
    for (let domain of this.domains)
      if (domain.name == domainName)
        return domain;
    const domain = new Domain(this, domainName);
    await domain.saveNew();
    this.domains.push(domain);
    return domain;
  }
  
  /**
   * Extract links from the given page, and calls testToAddPage() for each.
   * So far only a elements without rel=nofollow are used.
   * @param {Page} page
   * @returns {Promise}
   */
  extractLinks(page) {
    console.log("audit extractLinks");
    if (page.depth >= this.maxDepth)
      return Promise.resolve();
    return this.driver.executeScript(`
      let as = document.getElementsByTagName('a');
      return Array.from(as)
        .filter(a => a.getAttribute('rel') != 'nofollow')
        .map(a => a.href);
    `)
    .then(hrefs => {
      for (let href of hrefs) {
        if (href != null && href != '')
          this.testToAddPage(page, href);
      }
    })
    .catch((error) => {
      console.log("Error in extractLinks:");
      console.log(error);
    });
  }
  
  /**
   * Test if the given URL should be added for further checks,
   * and if so adds it to the HEAD queue.
   * Calls nextHEAD() to start queue processing if it is not already running.
   * @param {Page} originPage
   * @param {string} url
   */
  testToAddPage(originPage, url) {
    if (!/^https?:\/\//i.test(url))
      return;
    let ind = url.indexOf('#');
    if (ind > -1)
      url = url.substring(0, ind);
    if (this.testedURLs.indexOf(url) > -1)
      return;
    this.testedURLs.push(url);
    const domainName = this.extractDomainNameFromURL(url);
    if (domainName == null) {
      console.log("Domain not found for " + url);
      return;
    }
    if (!this.checkSubdomains) {
      if (domainName !== this.initialDomainName)
        return;
    } else {
      if (domainName.indexOf(this.initialDomainName) == -1 ||
          domainName.indexOf(this.initialDomainName) !=
          domainName.length - this.initialDomainName.length)
        return;
    }
    // check the MIME type and status before adding
    this.headToDo.push({originPage, url, domainName});
    if (!this.headTestsRunning)
      this.nextHEAD();
  }

  /**
   * Start or continue processing HEAD requests in the queue, to check if
   * URLs are worth checking for accessibility.
   * The MIME type should be text/html.
   */
  nextHEAD() {
    if (this.headToDo.length == 0) {
      this.headTestsRunning = false;
      return;
    }
    this.headTestsRunning = true;
    let {originPage, url, domainName} = this.headToDo.shift();
    console.log("HEAD " + url);
    fetch(url, {
      method: 'HEAD', redirect: 'follow'
    }).then((res) => {
      const mime = res.headers.get('content-type');
      if (mime != null && mime.indexOf('text/html') == 0) {
        if (res.redirected) {
          // NOTE: if we don't follow redirects, we don't have a way
          // to get the redirected URL
          // see: https://github.com/whatwg/fetch/issues/763
          if (res.url != url)
            this.testToAddPage(originPage, res.url)
          else
            console.log("redirected to the same URL ?!? " + url);
        } else {
          this.findDomain(domainName).then((domain) => {
            const page = this.newPage(originPage, domain, url, res.status);
            this.pagesToCheck.push(page);
          });
        }
      } else {
        console.log("ignored MIME: " + mime);
      }
      this.nextHEAD();
    }).catch(error => {
      if (error.message != null &&
          error.message.indexOf('ssl_choose_client_version:unsupported protocol') > 0) {
        // Debian does not support TLS<1.2, but some sites are still using it...
        this.findDomain(domainName).then((domain) => {
          const page = this.newPage(originPage, domain, url, null);
          page.errorMessage = "Insecure version of SSL !";
          this.pagesToCheck.push(page);
        });
      } else {
        console.error('error HEAD ' + url + ': ', error);
      }
      this.nextHEAD();
    });
  }
  
  /**
   * Return the current status of the audit (running, nbViolations, nbCheckedURLs)
   * @returns {Object}
   */
  status() {
    return {
      running: this.running,
      nbViolations: this.nbViolations,
      nbCheckedURLs: this.checkedURLs.length,
    };
  }
  
}
