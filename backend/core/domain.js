import DomainModel from '../models/domain.model';

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
  
}
