<div align="center">

  ![Superteam Earn Icon](/public/assets/square-logo-color.svg)

  <h2>Superteam Earn</h2>
  <p>
    <strong>An open source platform connecting crypto founders with elite talent to create bounties, and accelerate project completion</strong>
  </p>
  
  ![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)
  ![GitHub issues](https://img.shields.io/github/issues-raw/SuperteamDAO/earn)
  ![GitHub pull requests](https://img.shields.io/github/issues-pr/SuperteamDAO/earn)
  [![Follow](https://img.shields.io/twitter/follow/superteamearn.svg?style=social)](https://twitter.com/superteamearn)
</div>

## 🔗Official Links

- <img src="https://earn.superteam.fun/favicon.ico" title="Superteam Earn Icon" alt="superteam-earn-icon" width="24" height="24" /> Superteam Earn website - [https://earn.superteam.fun](https://earn.superteam.fun)
- <img src="https://superteam.fun/favicon.png" title="Superteam Icon" alt="superteam-icon" width="24" height="24" /> Superteam website - [https://superteam.fun](https://superteam.fun)
- <img src="https://x.com/favicon.ico" title="Superteam Earn X Icon" alt="superteam-earn-x-icon" width="24" height="24" /> Superteam Earn X/Twitter - [https://x.com/superteamearn](https://x.com/superteamearn)

## 🛠️Development Setup

### Prerequisites

- <img src="https://avatars.githubusercontent.com/u/9950313" title="NodeJS" alt="nodejs" width="28" height="28" /> [NodeJS](https://nodejs.org/en)
- <img src="https://avatars.githubusercontent.com/u/2452804" title="MySQL" alt="mysql" width="28" height="28" /> [MySQL](https://www.mysql.com)
- <img src="https://avatars.githubusercontent.com/u/21320719" title="pnpm" alt="pnpm" width="28" height="28" /> [pnpm](https://pnpm.io)
- <img src="https://avatars.githubusercontent.com/u/81824329" title="Privy" alt="privy" width="28" height="28" /> [Privy](https://www.privy.io)
- <img src="https://avatars.githubusercontent.com/u/1460763" title="Cloudinary" alt="cloudinary" width="28" height="28" /> [Cloudinary](https://cloudinary.com)
- <img src="https://avatars.githubusercontent.com/u/109384852" title="Resend" alt="resend" width="28" height="28" /> [Resend](https://resend.com)

### Getting Started

1. Clone the repository into a public Github repository (or fork it):
    ```bash
    git clone https://github.com/SuperteamDAO/earn.git
    ```

2. Navigate to the project directory:
    ```bash
    cd earn
    ```

3. Install the dependencies: 
    ```bash
    pnpm i
    ```

4. Set up your `.env` file.
  - Start by copying the `.env.example` file to a new file named `.env`. This file will store your local environment settings.
    
  - Database setup:

    **Option 1: Local MySQL (Recommended for Development)**

    The app automatically detects your database type based on `DATABASE_URL`. Choose your platform:

    <details>
    <summary><b>🍎 macOS</b></summary>

    1. Install MySQL using Homebrew:
       ```bash
       brew install mysql
       ```

    2. Start MySQL service:
       ```bash
       brew services start mysql
       ```

    3. Create database:
       ```bash
       mysql -u root -e "CREATE DATABASE earn_db"
       ```

    4. Set `DATABASE_URL` in `.env`:
       ```
       DATABASE_URL='mysql://root@localhost:3306/earn_db'
       ```
    </details>

    <details>
    <summary><b>🪟 Windows</b></summary>

    1. **Option A: Using MySQL Installer (Recommended for beginners)**
       - Download [MySQL Community Server Installer](https://dev.mysql.com/downloads/installer/)
       - Run the installer and choose "Developer Default"
       - Set root password when prompted (remember this!)
       - Complete installation

    2. **Option B: Using Package Manager**
       ```powershell
       # Using Chocolatey
       choco install mysql

       # OR using winget
       winget install Oracle.MySQL
       ```

    3. Start MySQL (if not already running):
       - Open "Services" app (Win + R, type `services.msc`)
       - Find "MySQL" service and start it

       OR via command line:
       ```powershell
       net start MySQL
       ```

    4. Create database:
       ```powershell
       mysql -u root -p -e "CREATE DATABASE earn_db"
       ```
       Enter your root password when prompted.

    5. Set `DATABASE_URL` in `.env`:
       ```
       DATABASE_URL='mysql://root:YOUR_PASSWORD@localhost:3306/earn_db'
       ```
       Replace `YOUR_PASSWORD` with your MySQL root password.
    </details>

    <details>
    <summary><b>🐧 Linux</b></summary>

    **Ubuntu/Debian:**
    ```bash
    # Install MySQL
    sudo apt update
    sudo apt install mysql-server

    # Start MySQL service
    sudo systemctl start mysql
    sudo systemctl enable mysql

    # Secure installation (optional but recommended)
    sudo mysql_secure_installation

    # Create database
    sudo mysql -e "CREATE DATABASE earn_db"

    # Create user (optional, for better security)
    sudo mysql -e "CREATE USER 'earnuser'@'localhost' IDENTIFIED BY 'your_password';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON earn_db.* TO 'earnuser'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    ```

    **Fedora/RHEL/CentOS:**
    ```bash
    # Install MySQL
    sudo dnf install mysql-server  # or 'yum' for older versions

    # Start MySQL service
    sudo systemctl start mysqld
    sudo systemctl enable mysqld

    # Create database
    sudo mysql -e "CREATE DATABASE earn_db"
    ```

    **Set `DATABASE_URL` in `.env`:**
    ```
    # If using root:
    DATABASE_URL='mysql://root@localhost:3306/earn_db'

    # If you created a user:
    DATABASE_URL='mysql://earnuser:your_password@localhost:3306/earn_db'
    ```
    </details>

    **After setting up MySQL, generate Prisma client:**
    ```bash
    npx prisma generate && npx prisma db push
    ```

    **Option 2: Cloud MySQL Database**

    If you prefer not to run MySQL locally, you can use cloud services (all have free tiers):
    - <img src="https://avatars.githubusercontent.com/u/66716858" title="Railway" alt="railway" width="28" height="28" /> [Setup MySQL with Railway](https://docs.railway.app/guides/mysql)
    - <img src="https://avatars.githubusercontent.com/u/36424661" title="Render" alt="render" width="28" height="28" /> [Setup MySQL with Render](https://docs.render.com/deploy-mysql)
    - [Setup MySQL with PlanetScale](https://planetscale.com/)

    Then set `DATABASE_URL` in `.env` with the connection string from your cloud provider.
    
  - <img src="https://avatars.githubusercontent.com/u/81824329" title="Privy" alt="privy" width="28" height="28" /> [Privy](https://www.privy.io/) setup:
    - Create a new privy app, Client Side Web App
    - Add env variables `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_SECRET`
    - Update the setting to include server side environment
    - Add env variable `PRIVY_VERIFICATION_KEY` (hidden under 'Verify with key instead' in Privy App settings)
    - Enable Solana External Wallets and Google social sign in
    - 
  - <img src="https://avatars.githubusercontent.com/u/109384852" title="Resend" alt="resend" width="28" height="28" /> [Resend](https://resend.com) setup:
    - To obtain your `RESEND_API_KEY`, visit the Resend dashboard.
    
  - <img src="https://avatars.githubusercontent.com/u/1460763" title="Cloudinary" alt="cloudinary" width="28" height="28" /> [Cloudinary](https://cloudinary.com/) setup:
    - To obtain your `CLOUDINARY_*` API keys, visit the Cloudinary dashboard. 

  ❗NOTE: If you are facing any issues with setup, feel free to contact [Abhishek](https://twitter.com/abhwshek) or [Jayesh](https://twitter.com/jayeshvp24)

5. Run the development server
    ```bash
    pnpm dev
    ```

## ⭐Contributing
We welcome contributions from everyone! Whether it's submitting an issue, a pull request, or suggesting new ideas, your input is highly valued. Check out our [contributing guide](CONTRIBUTING.md) for guidelines on how to proceed.

Facing an issue? Please feel free to reach out to [Abhishek](https://twitter.com/abhwshek), [Jayesh](https://twitter.com/jayeshvp24) or [Pratik](https://twitter.com/jayeshvp24)

### Why should you contribute to Earn?
- Consistent, good-quality contributions will earn you [contributor](https://docs.superteam.fun/the-superteam-handbook/getting-started/community-structure) status in the Superteam of your preference! Contributors get special access to channels on Discord, preferential entry to events, and is a great stepping stone to becoming a Superteam member.
- Get [XP](https://docs.superteam.fun/the-superteam-handbook/community/the-reputation-system) if you're already a Superteam Member or Contributor
- Unwavering love and support from the Superteam Earn team!

### Contributors
<a href="https://github.com/SuperteamDAO/earn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SuperteamDAO/earn" />
</a>

## 📊Repo Activity

<img width="100%" src="https://repobeats.axiom.co/api/embed/a82375612cac34000c44afc158c634bc0802a712.svg" />

