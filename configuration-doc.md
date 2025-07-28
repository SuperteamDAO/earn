# 硬件配置

内存推荐 8GB 以上

# 安装 node 环境

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

source ~/.bashrc

nvm install v22.16.0

node -v

npm i pnpm -g
pnpm -v
```

# 安装依赖

```sh
git clone https://github.com/SolDevCn/bounty-earn

pnpm i
```

# 配置 `.env`

`touch  .env`

```sh

# .env 推荐配置

DATABASE_URL="mysql://earn:123456@localhost:3306/bounty_earn"

# https://resend.com/
RESEND_API_KEY=''
REPLY_TO_EMAIL='onboarding@resend.dev'
RESEND_EMAIL='onboard@send.booming3.com' #

# https://cloudinary.com/
CLOUDINARY_CLOUD_NAME="bounty-earn"
CLOUDINARY_SUBMISSIONS_FOLDER=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

EMAIL_SERVER_USER='resend'
EMAIL_SERVER_HOST='smtp.resend.com'
EMAIL_SERVER_PORT='465'

ZEROBOUNCE_API_KEY=''

EARNCOGNITO_URL='https://earn.booming3.com'
EARNCOGNITO_SECRET=''

NEXTAUTH_SECRET=""
NEXTAUTH_URL="https://earn.booming3.com"

NEXT_PUBLIC_SITE_URL="https://earn.booming3.com/"
NEXT_PUBLIC_VERCEL_URL="https://earn.booming3.com/"
NEXT_PUBLIC_RPC_URL="https://devnet.helius-rpc.com/?api-key="
```

# 数据库

## 本地启动 mysql

```sh
docker-compose up
```

服务器安装 nysql

```sh
sudo apt install mysql
```

创建数据库 `bounty_earn`

```sql
CREATE DATABASE bounty_earn;
```

创建 mysql 用户

```sql
CREATE USER 'earn'@'localhost' IDENTIFIED BY 'password';

GRANT ALL PRIVILEGES ON database_name.* TO 'earn'@'localhost';

GRANT ALL PRIVILEGES ON *.* TO 'bounty_earn'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;
```

# 同步数据结构

```sh
npx prisma migrate dev --name init && npx prisma generate
```

# 运行

## dev 环境

```
pnpm dev
```

## 正式

```sh
pnpm build

pnpm start
```

# 访问

```
http://localhost:3000
```
