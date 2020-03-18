# Domain Accessibility Audit

This web application automatically crawls websites and checks for accessibility violations.
It can crawl within subdomains of the initial domain it starts with.
It reports statistics of violations for the whole audit, domains and pages.

## To start it
- Install [Docker](https://docs.docker.com/install/#supported-platforms) and [docker-compose](https://docs.docker.com/compose/install/) if needed.
- Edit a `.env` file at the root of this folder (next to the README),
  with the following parameters:
  ```
  ADMIN_USERNAME=
  ADMIN_PASSWORD=
  ```
  (this password is needed to create and remove audits)
- `docker-compose up -d`
- Direct a browser to `http://localhost/`.
- Use the username and the password you entered to create audits.

## To stop it
- A running audit can be stopped with the Stop button in the form to start a new audit.
- `docker-compose stop` will stop the containers.
- `docker-compose down` will stop and remove the containers. They are recreated automatically with `docker-compose up -d`.

## To check the server logs
- Get a list of container ids: `docker ps`.
- Look at the logs for a container: `docker logs <container_id>`.
- Keep looking in real time: `docker logs -f <container_id>`.  
  (another way to do that is to use `docker-compose up` without the `-d` option)

## To uninstall
**Warning**: this will remove all the data !!!
- `docker-compose down -v --rmi all --remove-orphans`
- Remove the files.

## Features
- Accessibility testing based on [axe](https://github.com/dequelabs/axe-core), which does not return false positives.
- Choice of accessibility standard to use: WCAG 2.0 Level A or AA, WCAG 2.1 Level AA or Section 508.
- Choice of web browser for testing: Firefox or Chromium.
- Option to check subdomains automatically.
- Options to use site maps and/or crawling to discover pages to test.
- Option to limit the number of pages checked per domain.
- Option to include only pages matching a regular expression.
- Results can be browsed on a dynamic website. Access to create new audits or remove them is protected by password.
- Results include violation statistics with links to Deque documentation given for the whole audit (including subdomains), for each domain and for each page.
- Easy way to see which domains or pages are most affected by specific violations.
- User and group management, with authorizations based on domains.
- 2 methods of authentication: local and SAML (experimental).

## Other environment variables
Besides the required `ADMIN_PASSWORD` variable, other variables can be used in `.env`:
- `MODE`: running environment, `development` or `production` (`production` by default)
- `RESTRICTED_IP`: an IP address which will be the only one able to access the app
  (`127.0.0.1` by default for development, `0.0.0.0` by default for production,
    set to `0.0.0.0` to allow connections from everywhere even in development)
- `DEVELOPMENT_PORT`: the port used for development (3142 by default)
- `DEVELOPMENT_API_PORT`: the port used for API calls in development (3143 by default)
- `PRODUCTION_PORT`: the port used for production, except with SSL (80 by default)
- `SAML_ENTRYPOINT`: SAML authentication: identity provider entrypoint
- `SAML_ISSUER`: SAML authentication: issuer string to supply to identity provider
- `SAML_CERT_FILENAME`: SAML authentication: name of the IdP's public signing certificate used to validate the signatures of the incoming SAML Responses (should be placed in `/certs`)
- `SAML_PRIVATE_CERT_FILENAME`: SAML authentication: name of the certificate used to sign requests sent to the IdP

## Permissions
Permissions are always applied to groups. Two groups are automatically created:
- `Superusers`: for application administrators, with all permissions enabled. The administrator given in the `.env` file is automatically added to this group.
- `Guests`: for users who are not logged in. By default, they are only able to read created audits, but this permission can be removed.

Another group can be created with SAML authentication:
- `Authenticated`: users who passed SAML authentication but do not have a matching user. They can have different permissions from guests.
More groups can be created and assigned users.

There are separate permissions to read audits, create audits, remove audits, and edit users and groups. The audit permissions can also be given for specific domains (which include subdomains).

## FAQ
- Does this tool accurately reflect a website's state of accessibility ?  
  No. Because it is not reporting potential false positives, it will miss a number
  of real web accessibility issues. Even if it was reporting potential false positives,
  it might still miss some other issues that are hard to identify automatically.
  It is meant as a tool to help identify and fix the most common issues, but
  does not replace a full manual audit.  
  That being said, it is a good and economic first step to fix reported issues
  before doing a more thorough manual audit, and there is often a lot to fix.
  Also, results over a large number of websites are more likely to be consistent,
  objective and uniform than with manual audits, so it is a useful tool to
  compare standard compliance and measure progress.
- How to set up SSL ?  
  This could be done with a proxy, but if you want to set up SSL directly in node,
  this is possible in production mode on port 443:
  - Add `server.key` and `server.crt` inside the `certs` directory.
  - Restart with docker-compose: `docker-compose up -d`
- Why would I ever want to not use site maps when they're available ?  
  Site maps are great to check entire sites. A crawling depth of 0 can even
  be used when they are complete.
  However one might want to focus on the most visible pages
  (based on the number of clicks used to reach them).
  Ignoring site maps and crawling the sites with a maximum depth is
  a better option in this case.
- How could I check only a part of a site ?  
  With the "Include only paths matching the regular expression" option,
  for instance `^/section1` would only match paths starting with `/section1`
  (the paths the expression is checked against start with a slash,
  but do not include the protocol or domain parts of the URL).
- How can I precisely control which ports are exposed by the application ?  
  Edit the `ports` section in `docker-compose.yml`. Development mode needs 2 ports
  (one for the static web files and one for the API), but production mode only needs 1.
- Do I need to add a "delay to let dynamic pages load" ?  
  The application is always waiting for the initial page load. However some web pages
  (such as the ones generated by this application!) do a server request after
  the initial load before they display anything. If the accessibility checks start
  before content is loaded, they might fail one way or another.  
  Issues can also occur when a page has a meta refresh tag (see below).  
  In both cases, adding a delay before the checks after the initial load can
  resolve problems.  
  A long delay (such as 1000 ms) is more likely to resolve problems, but it can
  slow down the audit. A short one (100 ms) might be sufficient for very fast websites,
  but might not be enough for slow ones. Experimenting might be the best way
  to choose a value.
- How could I customize the application's header and footer ?  
  `client/src/Header.js` and `client/src/Footer.js` can be customized.
  They are using the [React JSX](https://reactjs.org/docs/introducing-jsx.html) syntax.
  Images can be added to `client/public`.
  When git is used, these files can be added to `.git/info/exclude` to avoid
  warnings when the application is updated.
  The container will have to be restarted in production.
- I set an admin password in the `.env` file but I can't log in. What is going on ?  
  The variables passed to the Docker container with the `.env` file on the host are used only when the container is created, and the container is not updated when the file is modified afterwards. If you have modified the `.env` file after launching the application for the first time, you can simply delete the containers and recreate them. Since they don't contain any data (which is saved in a Docker volume), you will not lose any saved audit data.  
  `docker-compose down`  
  `docker-compose up -d`  
  The administrator user is only created the first time the application is launched with an administrator password. If you have started it once with a password but without `ADMIN_USERNAME`, it will have been created with the default `admin` username. You can use that name to log in and modify the user name.  
  Also make sure the `.env` file is created in the same directory as the `README.md` file, and that `ADMIN_USERNAME` and `ADMIN_PASSWORD` are uppercase.

## Current issues
- Browsers and drivers might crash sometimes, resulting in scan errors, but the audit will recover and continue.
- Some redirects like meta refresh can also cause scan errors, as the page changes while axe tries to check the page.

## Current non-features that would be nice to have in the future
- Possibility to access non-public websites.
- Taking `robots.txt` into account.
- Option to only start subdomain audits at the root.
- Reporting more than accessibility violations.
- Ability to pause an audit.
- Option to ignore pages returning a 404 status code.
- Regular expression to ignore some URLs.
- Easy way to export data.

## Licence
GPL 3.0.

## Development
This project is using the MERN stack. Docker is used for both development and production.

Tests should be run in Docker:
- `docker-compose run --rm accessibility_audit npm run test:server`
- `docker-compose run --rm accessibility_audit npm run test:client`

ESLint should be integrated in the editor, which might require an `npm install` on the host machine.
It can also be used to check the whole project, using Docker:
- `docker-compose run --rm accessibility_audit npm run lint`

## Technologies used
- [axe](https://github.com/dequelabs/axe-core)
- [Selenium WebDriver](https://www.seleniumhq.org/projects/webdriver/)
- [axe-webdriverjs](https://github.com/dequelabs/axe-webdriverjs)
- [Passport](http://www.passportjs.org/)
- [Passport-SAML](https://github.com/bergie/passport-saml)
- [Docker](https://www.docker.com/)
- [Node](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Firefox](https://www.mozilla.org/en-US/firefox/)
- [Chromium](https://www.chromium.org/Home)
- [Debian](https://www.debian.org/)
