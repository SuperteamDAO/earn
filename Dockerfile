FROM node:20-alpine

WORKDIR /user/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm prisma generate

EXPOSE 3000

CMD [ "pnpm","run","docker-dev" ]