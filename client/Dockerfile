FROM node:10.10-alpine as build-stage
WORKDIR /client

COPY client .

RUN npm i -g yarn

CMD yarn install && yarn start