FROM node:12

ENV NODE_ENV development

WORKDIR /app

RUN apt-get update && apt-get install -yq \
  firefox-esr chromium=73.0.3683.75-1~deb9u1 xvfb xsel unzip

# geckodriver
# see latest at https://github.com/mozilla/geckodriver/releases/
RUN wget -q "https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz" \
  -O /tmp/geckodriver.tgz \
  && tar zxf /tmp/geckodriver.tgz -C /usr/bin/ \
  && rm /tmp/geckodriver.tgz

# chromedriver
# see latest at http://chromedriver.storage.googleapis.com/index.html
RUN wget -q "http://chromedriver.storage.googleapis.com/73.0.3683.68/chromedriver_linux64.zip" \
  -O /tmp/chromedriver.zip \
  && unzip /tmp/chromedriver.zip -d /usr/bin/ \
  && rm /tmp/chromedriver.zip

# create symlinks to chromedriver and geckodriver (to the PATH)
RUN ln -s /usr/bin/geckodriver /usr/bin/chromium-browser \
  && chmod 777 /usr/bin/geckodriver \
  && chmod 777 /usr/bin/chromium-browser

COPY package.json ./

RUN npm install

CMD ["npm", "run", "start:dev"]
