# Contributing to Earn

### How to Contribute

1. Fork this repository to your own GitHub account and then clone it to your local device.

2. Create a new branch where you'll do your work.
    ```bash
    git checkout -b my-new-feature
    ```
3. Install the dependencies with:
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

    If you prefer not to run MySQL locally, use a cloud service:
    - [Setup MySQL with Railway](https://docs.railway.app/guides/mysql) (Free tier available)
    - [Setup MySQL with Render](https://docs.render.com/deploy-mysql) (Free tier available)
    - [Setup MySQL with PlanetScale](https://planetscale.com/) (Free tier available)

    Then set `DATABASE_URL` in `.env` with the connection string from your cloud provider.
      
  - You have to set up resend to run the app:
    - [Resend](https://resend.com): To obtain your `RESEND_API_KEY`, visit the Resend dashboard. This credential is essential for setting up Email Auth.

5. Start Developing
    ```bash
    pnpm dev
    ```

## Making a Pull Request

- Be sure to [check the "Allow edits from maintainers" option](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork) while creating your PR as we may suggest some changes or request improvements.
- Set the base branch as `staging` when opening a pull request.
- If your PR refers to or fixes an issue, be sure to add `refs #XXX` or `fixes #XXX` to the PR description. Replacing `XXX` with the respective issue number. See more about [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).
- Be sure to fill the PR Template accordingly.

## Guidelines for committing pnpm lockfile

Do not commit your `pnpm-lock.yaml` unless you've made changes to the `package.json`. If you've already committed `pnpm-lock.yaml` unintentionally, follow these steps to undo:

If your last commit has the `pnpm-lock.yaml` file alongside other files and you only wish to uncommit the `pnpm-lock.yaml`:
   ```bash
   git checkout HEAD~1 pnpm-lock.yaml
   git commit -m "Revert pnpm-lock.yaml changes"
   ```
If you've pushed the commit with the `pnpm-lock.yaml`:
   1. Correct the commit locally using the above method.
   2. Carefully force push:

   ```bash
   git push origin <your-branch-name> --force
   ```

If `pnpm-lock.yaml` was committed a while ago and there have been several commits since, you can use the following steps to revert just the `pnpm-lock.yaml` changes without impacting the subsequent changes:

1. **Checkout a Previous Version**:
   - Find the commit hash before the `pnpm-lock.yaml` was unintentionally committed. You can do this by viewing the Git log:
     ```bash
     git log pnpm-lock.yaml
     ```
   - Once you have identified the commit hash, use it to checkout the previous version of `pnpm-lock.yaml`:
     ```bash
     git checkout <commit_hash> pnpm-lock.yaml
     ```

2. **Commit the Reverted Version**:
   - After checking out the previous version of the `pnpm-lock.yaml`, commit this change:
     ```bash
     git commit -m "Revert pnpm-lock.yaml to its state before unintended changes"
     ```

3. **Proceed with Caution**:
   - If you need to push this change, first pull the latest changes from your remote branch to ensure you're not overwriting other recent changes:
     ```bash
     git pull origin <your-branch-name>
     ```
   - Then push the updated branch:
     ```bash
     git push origin <your-branch-name>
     ```