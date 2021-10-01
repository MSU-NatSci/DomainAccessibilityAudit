FROM debian:bullseye
ARG NODE_USER_UID=1000
ARG NODE_USER_GID=1000

WORKDIR /app

# Get Chromium, Firefox and Node
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN apt-get update && apt-get install -y curl gnupg vim wget libdbus-glib-1-2 bzip2
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
# firefox-esr no longer seems to work well, installing latest instead
# (libdbus-glib-1-2 is a dependency)
RUN wget -nv -O /tmp/FirefoxSetup.tar.bz2 "https://download.mozilla.org/?product=firefox-latest&os=linux64&lang=en-US" \
  && tar xjf /tmp/FirefoxSetup.tar.bz2 -C /opt/ \
  && ln -s /opt/firefox/firefox /usr/bin/firefox
RUN apt-get install -yq \
  chromium chromium-driver xvfb xsel unzip nodejs

# geckodriver
# see latest at https://github.com/mozilla/geckodriver/releases/
RUN wget -q "https://github.com/mozilla/geckodriver/releases/download/v0.26.0/geckodriver-v0.26.0-linux64.tar.gz" \
  -O /tmp/geckodriver.tgz \
  && tar zxf /tmp/geckodriver.tgz -C /usr/bin/ \
  && rm /tmp/geckodriver.tgz

# create symlinks to chromedriver and geckodriver (to the PATH)
RUN ln -s /usr/bin/geckodriver /usr/bin/chromium-browser \
  && chmod 777 /usr/bin/geckodriver \
  && chmod 777 /usr/bin/chromium-browser

# Run node as node with primary group node
RUN groupadd --gid $NODE_USER_GID node \
  && useradd --uid $NODE_USER_UID --gid node --shell /bin/bash --create-home node

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY backend/package.json backend/package-lock.json backend/babel.config.js ./backend/

RUN chown -R node:node /app

USER node

ENV HUSKY_SKIP_INSTALL 1
RUN npm install

CMD ["npm", "run", "start"]
