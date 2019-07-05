import DomainModel from '../models/domain.model';
import fetch from 'node-fetch';
const parseString = require('xml2js').parseString;

export default class Domain {
  
  /**
   * Domain constructor.
   * @param {Audit} audit
   * @param {string} name - domain name
   */
  constructor(audit, name) {
    /** @member {Audit} */
    this.audit = audit;
    /** @member {string} - domain name */
    this.name = name;
    /** @member {DomainModel} - database object for this domain */
    this.dbObject = null;
    /** @member {Number} */
    this.pageCount = 0;
  }
  
  /**
   * Save a new domain in the database.
   * @returns {Promise}
   */
  saveNew() {
    let domain = new DomainModel({
      auditId: this.audit.dbObject._id,
      name: this.name,
      nbCheckedURLs: 0,
      nbViolations: 0,
      violationStats: {},
    });
    return domain.save()
      .then((domainObject) => this.dbObject = domainObject)
      .catch((err) => console.error("Error saving new domain:", err));
  }
  
  /**
   * this is just a version of xml2js' parseString using Promises
   * @param {string} text
   * @returns {Promise<Object>}
   */
  parseXML(text) {
    return new Promise((resolve, reject) => {
      parseString(text, (err, result) => {
        if (result) {
          resolve(result);
        }
        reject(err);
      });
    });
  }
  
  /**
   * @returns {string}
   */
  sitemapURL() {
    return 'http://' + this.name + '/sitemap.xml';
  }
  
  /**
   * Try to read the sitemap.xml file for the domain.
   * @returns {Promise<Object>}
   */
  readSitemap() {
    return fetch(this.sitemapURL(), {
      method: 'GET', redirect: 'follow'
    }).then(res => res.text())
    .then((text) => this.parseXML(text));
  }
}
