# 硬件配置

内存推荐 至少 8GB

操作系统 Ubunut 24.04

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

# 邮件服务
# https://resend.com/
RESEND_API_KEY=''
REPLY_TO_EMAIL='onboarding@resend.dev'
RESEND_EMAIL='onboard@send.booming3.com' #

# 邮件服务
# 不用改动
EMAIL_SERVER_USER='resend'
EMAIL_SERVER_HOST='smtp.resend.com'
EMAIL_SERVER_PORT='465'

# 图片储存服务
# 通过 https://cloudinary.com/ 直接申请即可
CLOUDINARY_CLOUD_NAME="bounty-earn"
CLOUDINARY_SUBMISSIONS_FOLDER=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""


# 识别垃圾邮件
# https://www.zerobounce.net/ 直接申请即可
# 在此版本中 已经skip，可以不用申请
EARNCOGNITO_URL='https://earn.booming3.com'
ZEROBOUNCE_API_KEY=''
EARNCOGNITO_SECRET=''

# 随机密钥
# 通过 openssl rand -base64 32 即可获取
# 参考：https://stackoverflow.com/questions/75000633/where-to-generate-next-auth-secret-for-next-auth
NEXTAUTH_SECRET=""

# 在本地运行 可以替换为 http://localhost:3000
NEXTAUTH_URL="https://earn.booming3.com"
NEXT_PUBLIC_SITE_URL="https://earn.booming3.com/"
NEXT_PUBLIC_VERCEL_URL="https://earn.booming3.com/"

# solana rpc 服务
# https://www.helius.dev/ 直接申请即可
# 正式环境请用 mainnet：https://mainnet.helius-rpc.com/?api-key=
NEXT_PUBLIC_RPC_URL="https://devnet.helius-rpc.com/?api-key="
```

# 数据库

## 本地启动 mysql

```sh
docker-compose up
```

本地运行 mysql 后，直接跳过 `服务器安装 mysql` 步骤

## 服务器安装 mysql

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

# 本地访问

```
http://localhost:3000
```
