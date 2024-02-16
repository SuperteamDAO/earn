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
  - You have to set up resend to run the app:
    - [Resend](https://resend.com): To obtain your `RESEND_API_KEY` and `RESEND_EMAIL`, visit the Resend dashboard. These credentials are essential for integrating with Resend's services in your project.
5. Start Developing
    ```bash
    pnpm dev
    ```

## Making a Pull Request

- Be sure to [check the "Allow edits from maintainers" option](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork) while creating your PR as we may suggest some changes or request improvements.
- Set the base branch as `staging` when opening a pull request.
- If your PR refers to or fixes an issue, be sure to add `refs #XXX` or `fixes #XXX` to the PR description. Replacing `XXX` with the respective issue number. See more about [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).
- Be sure to fill the PR Template accordingly.

## Guidelines for committing yarn lockfile

Do not commit your `yarn.lock` unless you've made changes to the `package.json`. If you've already committed `yarn.lock` unintentionally, follow these steps to undo:

If your last commit has the `yarn.lock` file alongside other files and you only wish to uncommit the `yarn.lock`:
   ```bash
   git checkout HEAD~1 yarn.lock
   git commit -m "Revert yarn.lock changes"
   ```
If you've pushed the commit with the `yarn.lock`:
   1. Correct the commit locally using the above method.
   2. Carefully force push:

   ```bash
   git push origin <your-branch-name> --force
   ```

If `yarn.lock` was committed a while ago and there have been several commits since, you can use the following steps to revert just the `yarn.lock` changes without impacting the subsequent changes:

1. **Checkout a Previous Version**:
   - Find the commit hash before the `yarn.lock` was unintentionally committed. You can do this by viewing the Git log:
     ```bash
     git log yarn.lock
     ```
   - Once you have identified the commit hash, use it to checkout the previous version of `yarn.lock`:
     ```bash
     git checkout <commit_hash> yarn.lock
     ```

2. **Commit the Reverted Version**:
   - After checking out the previous version of the `yarn.lock`, commit this change:
     ```bash
     git commit -m "Revert yarn.lock to its state before unintended changes"
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