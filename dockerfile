FROM node:19-alpine3.18



WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force

COPY . .


EXPOSE 3003