
export default class Permissions {
  
  constructor(userInfo) {
    this.authenticationMethod = userInfo.authenticationMethod;
    this.user = userInfo.user;
  }
  
  loggedIn() {
    return this.user != null && this.user.username !== 'guest';
  }
  
  domainReadAllowed(domainName) {
    if (!this.user)
      return false;
    for (const g of this.user.groups) {
      if (g.permissions.readAllAudits)
        return true;
      for (const d of g.permissions.domains) {
        if (d.read) {
          if (d.name === domainName)
            return true;
          if (domainName.endsWith('.' + d.name))
            return true;
        }
      }
    }
    return false;
  }

  domainDeleteAllowed(domainName) {
    if (!this.user)
      return false;
    for (const g of this.user.groups) {
      if (g.permissions.deleteAllAudits)
        return true;
      for (const d of g.permissions.domains) {
        if (d.delete) {
          if (d.name === domainName)
            return true;
          if (domainName.endsWith('.' + d.name))
            return true;
        }
      }
    }
    return false;
  }

  domainCreateAllowed(domainName) {
    if (!this.user)
      return false;
    for (const g of this.user.groups) {
      if (g.permissions.createAllAudits)
        return true;
      for (const d of g.permissions.domains) {
        if (d.create) {
          if (d.name === domainName)
            return true;
          if (domainName.endsWith('.' + d.name))
            return true;
        }
      }
    }
    return false;
  }

  anyAuditCreateAllowed() {
    if (!this.user)
      return false;
    for (const g of this.user.groups) {
      if (g.permissions.createAllAudits)
        return true;
      for (const d of g.permissions.domains) {
        if (d.create)
          return true;
      }
    }
    return false;
  }

  userAndGroupEditAllowed() {
    if (!this.user)
      return false;
    for (const g of this.user.groups) {
      if (g.permissions.editUsersAndGroups)
        return true;
    }
    return false;
  }
  
}
