FROM node:10-alpine

WORKDIR /usr/src/app

RUN npm install -g grunt-cli

COPY package.json ./
RUN npm install

COPY . .

RUN grunt build

EXPOSE 9005

CMD [ "grunt", "serve" ]

