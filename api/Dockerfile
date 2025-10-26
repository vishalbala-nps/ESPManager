FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm install pm2 -g

EXPOSE 3001

CMD ["pm2-runtime", "index.js"]
