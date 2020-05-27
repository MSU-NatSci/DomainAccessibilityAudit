FROM debian:buster

WORKDIR /app

# Get Chromium, Firefox and Node
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN apt-get update && apt-get install -y curl gnupg vim
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -yq \
  chromium chromium-driver firefox-esr xvfb xsel unzip nodejs wget

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
RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY backend/package.json backend/package-lock.json backend/babel.config.js ./backend/

RUN chown -R node:node /app

USER node

ENV HUSKY_SKIP_INSTALL 1
RUN npm install

CMD ["npm", "run", "start"]
