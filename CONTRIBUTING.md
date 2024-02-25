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
  - Use `openssl rand -base64 32` to generate a key and add it under `NEXTAUTH_SECRET` in the .env file.
  - Database setup
    - Create a local `MySQL` instance and replace `<user>`, `<pass>`, `<db-host>`, and `<db-port>` with their applicable values.
      ```
      DATABASE_URL='mysql://<user>:<pass>@<db-host>:<db-port>'
      ``` 
    - If you don't want to create a local DB, then you can also consider using services like railway.app or render.
      - [Setup MySQL DB with railway.app](https://docs.railway.app/guides/mysql)
      - [Setup MYSQL DB with render](https://docs.render.com/deploy-mysql)

    - Generate prisma migrations & client.
      ```bash
      npx prisma migrate dev --name init && npx prisma generate
      ```
      
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