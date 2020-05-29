import crypto from 'crypto';
import fs from 'fs';
import util from 'util';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as SAMLStrategy } from 'passport-saml';

import UserModel from '../models/user.model';
import GroupModel from '../models/group.model';
import UserGroupModel from '../models/user_group.model';

let guestGroup = null;

export const authenticationMethod =
  (process.env.SAML_ENTRYPOINT && process.env.SAML_ISSUER) ?
    'SAML' : 'local';

export const initPassport = () => {
  if (authenticationMethod == 'SAML') {
    const entryPoint = process.env.SAML_ENTRYPOINT;
    const issuer = process.env.SAML_ISSUER;
    const params = {
      path: '/api/app/login/callback',
      /* might have to provide protocol and host here */
      entryPoint,
      issuer,
    };
    if (process.env.SAML_CERT_FILENAME)
      params.cert = fs.readFileSync(
        '/app/certs/' + process.env.SAML_CERT_FILENAME, 'utf8');
    if (process.env.SAML_PRIVATE_CERT_FILENAME)
      params.privateCert = fs.readFileSync(
        '/app/certs/' + process.env.SAML_PRIVATE_CERT_FILENAME, 'utf8');
    passport.use(new SAMLStrategy(params, async (profile, cb) => {
      if (profile == null) {
        cb(new Error("Could not get user profile."));
        return;
      }
      let username = profile.uid;
      if (!username)
        username = profile['urn:oid:0.9.2342.19200300.100.1.1'];
      if (!username) {
        cb(new Error("No uid in the user profile."));
        return;
      }
      try {
        let user = await UserModel.findByUsername(username);
        if (user == null) {
          const ag = await getAuthenticatedGroup();
          user = {
            _id: 'authenticated',
            username: 'authenticated',
            firstname: '',
            lastname: '',
            groups: [ag],
          };
        }
        cb(null, user);
      } catch (err) {
        cb(err);
      }
    }));
  } else {
    passport.use(new LocalStrategy(async (username, password, cb) => {
      try {
        const user = await localLogin(username, password);
        if (user == null)
          cb(null, false);
        else
          cb(null, user);
      } catch (err) {
        cb(err);
      }
    }));
  }
  passport.serializeUser((user, cb) => {
    cb(null, user._id);
  });
  passport.deserializeUser(async (id, cb) => {
    if (id == 'authenticated') {
      const ag = await getAuthenticatedGroup();
      const user = {
        _id: 'authenticated',
        username: 'authenticated',
        firstname: '',
        lastname: '',
        groups: [ag],
      };
      cb(null, user);
    } else if (id == 'guest') {
      const user = {
        _id: 'guest',
        username: 'guest',
        firstname: '',
        lastname: '',
        groups: [guestGroup],
      };
      cb(null, user);
    } else {
      try {
        const user = await UserModel.findById(id);
        cb(null, user);
      } catch (err) {
        cb(err);
      }
    }
  });
};

const hashConfig = {
  saltBytes: 64,
  hashBytes: 64,
};

const scrypt = util.promisify(crypto.scrypt);

export const hashUserPassword = async (user) => {
  const salt = crypto.randomBytes(hashConfig.saltBytes);
  const hash = await scrypt(user.password, salt,
    hashConfig.hashBytes);
  user.password = [salt.toString('base64'), hash.toString('base64')].join(':');
  return user;
};

const verifyPassword = async (user, password) => {
  const [salt64, hash64] = user.password.split(':');
  const salt = Buffer.from(salt64, 'base64');
  const hash2 = await scrypt(password, salt,
    hashConfig.hashBytes);
  return hash64 === hash2.toString('base64');
};

export const localLogin = async (username, password) => {
  let user = await UserModel.findByUsername(username);
  if (user == null) {
    // if the user is not found, we should still waste some time
    // otherwise it will be obvious the user does not exist
    user = {
      username: '404NOTFOUND',
      password: 'Q3bDgpauIBDEJX1/L0aJ7FEBDDVWFRHZZ96Axrz0Ycix/EGOlqvaIq3Mb5pSsb1wIRX1UBqA6cNWN1I7OPGqMA==:dg8D90g9YcKpsFms9sllupvQDNG59lxjOvCSRFqOMLxaypV/ESoTpAKmYMRwwHfWiAVQUek/8FyvA2hflnwKXw==',
    };
  }
  const verified = await verifyPassword(user, password);
  if (!verified || user.username == '404NOTFOUND')
    throw new Error("Wrong username or password.");
  delete user.password;
  return user;
};

const getUserGroups = (user) => {
  if (user != null)
    return user.groups;
  if (guestGroup != null)
    return [guestGroup];
  return [];
};

export const domainReadAllowed = (user, domainName) => {
  for (const g of getUserGroups(user)) {
    if (g.permissions.readAllAudits)
      return true;
    for (const d of g.permissions.domains) {
      if (d.read) {
        if (d.name == domainName)
          return true;
        if (domainName.endsWith('.' + d.name))
          return true;
      }
    }
  }
  return false;
};

export const domainDeleteAllowed = (user, domainName) => {
  for (const g of getUserGroups(user)) {
    if (g.permissions.deleteAllAudits)
      return true;
    for (const d of g.permissions.domains) {
      if (d.delete) {
        if (d.name == domainName)
          return true;
        if (domainName.endsWith('.' + d.name))
          return true;
      }
    }
  }
  return false;
};

export const domainCreateAllowed = (user, domainName) => {
  for (const g of getUserGroups(user)) {
    if (g.permissions.createAllAudits)
      return true;
    for (const d of g.permissions.domains) {
      if (d.create) {
        if (d.name == domainName)
          return true;
        if (domainName.endsWith('.' + d.name))
          return true;
      }
    }
  }
  return false;
};

export const userAndGroupEditAllowed = (user) => {
  for (const g of getUserGroups(user)) {
    if (g.permissions.editUsersAndGroups)
      return true;
  }
  return false;
};

/*
This was meant to display something for an audit when a user
is not allowed to see everything in the audit.
We would have to filter violationStats too, this is getting too complicated.
export const filterAudit = (user, audit) => {
  audit.domains = audit.domains.filter((d) => domainReadAllowed(user, d.name));
  for (const d of audit.domains)
    d.deleteAllowed = domainDeleteAllowed(user, d.name);
};
*/

export const filterAudits = (user, audits) => {
  const newAudits = audits.filter((audit) =>
    domainReadAllowed(user, audit.initialDomainName));
  return newAudits;
};

export const createGuestGroup = async () => {
  try {
    let gg = await GroupModel.getGuestGroup();
    if (gg == null)
      gg = await GroupModel.createGuestGroup();
    guestGroup = gg;
  } catch (err) {
    console.log("Error getting the guest group: " + err.message);
  }
};

export const getAuthenticatedGroup = async () => {
  try {
    let ag = await GroupModel.getAuthenticatedGroup();
    if (ag == null)
      ag = await GroupModel.createAuthenticatedGroup();
    return ag;
  } catch (err) {
    console.log("Error getting the authenticated group: " + err.message);
  }
};

export const updateGuestGroup = (gg) => {
  guestGroup = gg;
};

export const createSuperuserGroup = async () => {
  let sg;
  try {
    sg = await GroupModel.getSuperuserGroup();
  } catch (err) {
    console.log("Error reading the superuser group: " + err.message);
    return;
  }
  if (sg == null) {
    if (!process.env.ADMIN_PASSWORD) {
      console.log("The ADMIN_PASSWORD variable is missing - not creating the admin user and group.");
    } else {
      try {
        // create the Superusers group
        sg = await GroupModel.create({
          name: 'Superusers',
          permissions: {
            createAllAudits: true,
            readAllAudits: true,
            deleteAllAudits: true,
            editUsersAndGroups: true,
            domains: [],
          }
        });
      } catch (err) {
        console.log("Error creating the superuser group: " + err.message);
        return;
      }
      try {
        // create an admin
        let user = {
          username: process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME : 'admin',
          firstname: '',
          lastname: '',
          password: process.env.ADMIN_PASSWORD,
        };
        await hashUserPassword(user);
        user = await UserModel.create(user);
        await UserGroupModel.create({ groupId: sg._id, userId: user._id });
      } catch (err) {
        console.log("Error creating the admin: " + err.message);
      }
    }
  }
};

export const getGuestGroup = () => {
  return guestGroup;
};
