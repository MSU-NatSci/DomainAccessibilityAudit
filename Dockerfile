FROM debian:sid
# We are using sid instead of stretch to use a recent version of Firefox

WORKDIR /app

# Get Chromium, Firefox and Node
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -yq \
  chromium chromium-driver firefox xvfb xsel unzip nodejs wget

# geckodriver
# see latest at https://github.com/mozilla/geckodriver/releases/
RUN wget -q "https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz" \
  -O /tmp/geckodriver.tgz \
  && tar zxf /tmp/geckodriver.tgz -C /usr/bin/ \
  && rm /tmp/geckodriver.tgz

# create symlinks to chromedriver and geckodriver (to the PATH)
RUN ln -s /usr/bin/geckodriver /usr/bin/chromium-browser \
  && chmod 777 /usr/bin/geckodriver \
  && chmod 777 /usr/bin/chromium-browser

COPY package.json ./
RUN npm install

COPY client/package.json ./client/
WORKDIR /app/client
RUN npm install
WORKDIR /app

CMD ["npm", "run", "start"]
