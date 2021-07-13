#first build
FROM node:12 AS build
LABEL autodelete="true"

RUN apt-get update &&\
  apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/*

# Create app directory
ENV APP_PATH=/usr/src/app
WORKDIR $APP_PATH

# Install app dependencies
# Log in to Nexus so `npm install` comes from there instead of NPM's registry
COPY .npmrc .npmrc
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm install


# Bundle app source
COPY . .
# Must happen after `COPY . .` otherwise the copy re-copies the file over
RUN rm -f .npmrc

RUN npm run build
RUN npm run export

#second build without secrets
FROM nginx:1.17-alpine

RUN apk --no-cache upgrade

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN sed -i 's/80;/8080;/' /etc/nginx/conf.d/default.conf

COPY --chown=nginx:nginx --from=build /usr/src/app/out /usr/share/nginx/html
