FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node-dev

EXPOSE 4001

CMD ["npm", "run", "dev"]
