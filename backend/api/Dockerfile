FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @nestjs/cli

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]