import WebDriver from 'selenium-webdriver';
import AxeBuilder from 'axe-webdriverjs';
import firefox from 'selenium-webdriver/firefox';
import chrome from 'selenium-webdriver/chrome';

import fetch from 'node-fetch';
import AbortController from 'abort-controller';

import Page from './page';
import Domain from './domain';
import AuditModel from '../models/audit.model';

const pageLoadTimeout = 60000;
const headTimeout = 4000;

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
    /** @member {AuditModel} - database object for this audit */
    this.dbObject = null;
    /** @member {boolean} - true when there are HEAD tests being performed
      (there is an async queue for that) */
    this.headTestsRunning = false;
    this.firefoxPreferences = {
      'datareporting.healthreport.uploadEnabled': false,
      'browser.contentblocking.category': 'strict',
      'browser.contentblocking.enabled': true,
      'browser.newtabpage.activity-stream.feeds.telemetry': false,
      'browser.newtabpage.activity-stream.telemetry': false,
      'browser.ping-centre.telemetry': false,
      'browser.pocket.enabled': false,
      'browser.startup.homepage': 'about:blank',
      'media.autoplay.enabled': false,
      'media.autoplay.allow-muted': false,
      'network.prefetch-next': false,
      'reader.parse-on-load.enabled': false,
      'toolkit.telemetry.archive.enabled': false,
      'toolkit.telemetry.bhrPing.enabled': false,
      'toolkit.telemetry.enabled': false,
      'toolkit.telemetry.firstShutdownPing.enabled': false,
      'toolkit.telemetry.hybridContent.enabled': false,
      'toolkit.telemetry.newProfilePing.enabled': false,
      'toolkit.telemetry.reportingpolicy.firstRun': false,
      'toolkit.telemetry.shutdownPingSender.enabled': false,
      'toolkit.telemetry.unified': false,
      'toolkit.telemetry.updatePing.enabled': false,
    };
    /** @member {Object} - form parameters */
    this.params = {};
  }
  
  /**
   * Start the audit.
   * @param {Object} params - audit parameters
   * @param {string} params.firstURL - user's initial URL
   * @param {string} params.standard - accessibility standard to use with aXe
      (wcag2a|wcag2aa|wcag21aa|section508)
   * @param {boolean} params.checkSubdomains - true if subdomains are to be checked
   * @param {number} params.maxDepth - maximum crawling depth
   * @param {number} params.maxPagesPerDomain - maximum number of pages checked per domain (0 = no max)
   * @param {boolean} params.sitemaps - true if sitemap files should be used
   * @param {string} params.includeMatch - regular expression to include only matching paths
   * @param {string} params.browser - web browser name (firefox|chrome)
   * @param {number} params.postLoadingDelay - additional delay to let dynamic pages load (ms)
   * @returns {Promise<Object>} - this.dbObject (database object for this audit)
   */
  async start(params) {
    this.params = params;
    this.initialDomainName = this.extractDomainNameFromURL(params.firstURL);
    if (this.initialDomainName == null)
      throw new Error("No initial domain name");
    this.running = true;
    this.testedURLs = [params.firstURL];
    const audit = new AuditModel({
      ...params,
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
      this.running = false;
      throw error;
    }
    try {
      await this.createNewDriver();
    } catch (error) {
      console.log("Error in createNewDriver:");
      console.log(error);
      this.running = false;
      throw error;
    }
    const initialDomain = await this.findDomain(this.initialDomainName, null);
    this.pagesToCheck = [
      this.newPage(null, initialDomain, params.firstURL, null)
    ];
    initialDomain.pageCount++;
    this.nextURL();
    return this.dbObject;
  }
  
  /**
   * Create a new Selenium WebDriver instance, and also initialize
   * aXe's builder.
   */
  async createNewDriver() {
    console.log('createNewDriver');
    if (this.driver != null) {
      try {
        await this.driver.quit();
      } catch (error) {
        // ignore error, the connection might be closed already
        console.log("driver.quit(): " + error);
      }
    }
    this.driver = new WebDriver.Builder()
      .forBrowser(this.params.browser);
    if (this.params.browser == 'firefox') {
      const profile = new firefox.Profile();
      for (const key of Object.keys(this.firefoxPreferences))
        profile.setPreference(key, this.firefoxPreferences[key]);
      const options = new firefox.Options().setProfile(profile).headless();
      this.driver = this.driver.setFirefoxOptions(options);
    } else {
      this.driver = this.driver.setChromeOptions(
        new chrome.Options().headless().addArguments(['--no-sandbox']));
    }
    this.driver = this.driver.build();
    // about implicit: see https://stackoverflow.com/a/16079053/438970
    this.driver.manage().setTimeouts({
      pageLoad: pageLoadTimeout,
    });
    let tags;
    if (this.params.standard == 'wcag2a')
      tags = ['wcag2a'];
    else if (this.params.standard == 'wcag21aa')
      tags = ['wcag21aa', 'wcag2a'];
    else if (this.params.standard == 'section508')
      tags = ['section508'];
    else
      tags = ['wcag2aa', 'wcag2a'];
    this.aXeB = AxeBuilder(this.driver)
      .options({
        branding: {
          application: "Domain Accessibility Audit"
        },
        resultTypes: ["violations"],
      })
      .withTags(tags);
    // NOTE: resultTypes is used for performance, it reduces
    // processing related to non-violations
  }
  
  /**
   * Create a new Page object.
   * @param {Page} originPage - the page where the new one's URL was found
   * @param {Domain} domain - the domain the new page belongs to
   * @param {string} url - the page URL
   * @param {Number} status - status returned by the HEAD request
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
    if (this.pagesToCheck.length > 0 && !this.stopRequested) {
      const page = this.pagesToCheck.shift();
      page.startChecking();
    } else if (this.headTestsRunning && !this.stopRequested) {
      setTimeout(() => this.nextURL(), 1000);
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
    const domainObject = page.domain.dbObject;
    domainObject.nbCheckedURLs++;
    for (const violation of page.violations) {
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
    const violationCount = violation.nodes.length;
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
      object.violationStats.set(violation.id, vs);
    } else {
      vs.total += violationCount;
      if (subObj != null) {
        let found = false;
        for (const p of vs[subs]) {
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
    // update category stats
    if (violation.category != null) {
      let catCount = object.categories.get(violation.category);
      if (catCount == null)
        catCount = violationCount;
      else
        catCount += violationCount;
      object.categories.set(violation.category, catCount);
    }
  }
  
  /**
   * Stop the driver and saves the audit object with updated info.
   * This marks the end of the audit.
   */
  async endAudit() {
    console.log("endAudit");
    this.dbObject.complete = this.pagesToCheck.length == 0 && this.headToDo.length == 0;
    this.dbObject.dateEnded = new Date();
    await Promise.all([this.driver.quit(), this.dbObject.save()]);
    this.driver = null;
    this.running = false;
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
   * @param {Page} originPage
   * @returns {Promise<Domain>}
   */
  async findDomain(domainName, originPage) {
    for (const domain of this.domains)
      if (domain.name == domainName)
        return domain;
    const domain = new Domain(this, domainName);
    this.domains.push(domain);
    await domain.saveNew();
    if (this.params.sitemaps) {
      await domain.readSitemap()
        .then((sitemap) => {
          if (!sitemap.urlset)
            return;
          const sitemapPage = this.newPage(originPage, domain, domain.sitemapURL(), 200);
          for (const url of sitemap.urlset.url) {
            if (!url.loc || !url.loc.length)
              continue;
            this.testToAddPage(sitemapPage, url.loc[0]);
          }
        })
        .catch(err => {
          console.log("Error reading the site map:");
          console.log(err);
        });
    }
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
    if (page.depth >= this.params.maxDepth)
      return Promise.resolve();
    return this.driver.executeScript(`
      let as = document.getElementsByTagName('a');
      return Array.from(as)
        .filter(a => a.getAttribute('rel') != 'nofollow')
        .map(a => a.href);
    `)
      .then(hrefs => {
        for (const href of hrefs) {
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
    if (this.params.includeMatch != null && this.params.includeMatch != '') {
      const path = url.replace(/^https?:\/\/[^/]+/i, '');
      if (!path.match(this.params.includeMatch))
        return;
    }
    const ind = url.indexOf('#');
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
    if (!this.params.checkSubdomains) {
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
    if (!this.headTestsRunning && this.running && !this.stopRequested)
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
    const {originPage, url, domainName} = this.headToDo.shift();
    // avoid doing a HEAD request for a domain when it has already
    // reached the maximum number of pages to check
    const domain = this.domains.find(d => d.name == domainName);
    if (domain != null && this.params.maxPagesPerDomain > 0 &&
        domain.pageCount >= this.params.maxPagesPerDomain) {
      setTimeout(() => this.nextHEAD(), 0);
      return;
    }
    
    console.log("HEAD " + url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), headTimeout);
    fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })
      .then((res) => {
        const mime = res.headers.get('content-type');
        if (mime != null && mime.indexOf('text/html') == 0) {
          if (res.redirected) {
            // NOTE: if we don't follow redirects, we don't have a way
            // to get the redirected URL
            // see: https://github.com/whatwg/fetch/issues/763
            if (res.url != url)
              this.testToAddPage(originPage, res.url);
            else
              console.log("redirected to the same URL ?!? " + url);
          } else {
            this.continueWithHead(originPage, url, domainName, res, false);
          }
        } else {
          console.log("ignored MIME: " + mime);
        }
        if (this.running && !this.stopRequested)
          setTimeout(() => this.nextHEAD(), 0);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log("timeout for HEAD " + url);
        } else if (error.message != null &&
            error.message.indexOf('ssl_choose_client_version:unsupported protocol') > 0) {
          // Debian does not support TLS<1.2, but some sites are still using it...
          this.continueWithHead(originPage, url, domainName, null, true);
        } else {
          console.error('error HEAD ' + url + ': ', error);
        }
        if (this.running && !this.stopRequested)
          setTimeout(() => this.nextHEAD(), 0);
      })
      .finally(() => clearTimeout(timeout));
  }
  
  /**
   * This is called by nextHEAD() if the url is worth processing further.
   * @param {Page} originPage
   * @param {string} url
   * @param {string} domainName
   * @param {Object} res
   * @param {boolean} sslError
   */
  continueWithHead(originPage, url, domainName, res, sslError) {
    // ignore bad looking URLs that result in a 404 (probably a bad link)
    if (res != null && res.status == 404 && url.match(/.https?:\/\/|\s/)) {
      console.log("Ignored " + url + " (probably a bad link)");
      return;
    }
    // ignore pages with 401/407 status (we don't have a way to authenticate)
    // see https://github.com/w3c/webdriver/issues/385
    if (res != null && (res.status == 401 || res.status == 407)) {
      console.log("Ignored " + url + " because of status code " + res.status);
      return;
    }
    this.findDomain(domainName, originPage).then((domain) => {
      if (this.params.maxPagesPerDomain == 0 ||
          domain.pageCount < this.params.maxPagesPerDomain) {
        const page = this.newPage(originPage, domain, url,
          sslError ? null : res.status);
        if (sslError)
          page.errorMessage = "Insecure version of SSL !";
        this.pagesToCheck.push(page);
        domain.pageCount++;
      }
    });
  }
  
  /**
   * Return the current status of the audit
   * @returns {Object}
   */
  status() {
    return {
      initialDomainName: this.initialDomainName,
      running: this.running,
      nbViolations: this.nbViolations,
      nbCheckedURLs: this.checkedURLs.length,
      nbURLsToCheck: this.pagesToCheck.length,
      nbScanErrors: this.dbObject ? this.dbObject.nbScanErrors : 0,
    };
  }
  
}
