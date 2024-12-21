<div align="center">
  <br/>
  <img src="https://pbs.twimg.com/profile_images/1655546485365407744/dOeIC0R-_400x400.jpg" style="border-radius:10px" width="120px" height="auto"/>
  <h2>Superteam Earn</h2>
  <p>
    <strong>An open source platform connecting crypto founders with elite talent to create bounties, and accelerate project completion</strong>
  </p>
  
  ![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)
  ![GitHub issues](https://img.shields.io/github/issues-raw/SuperteamDAO/earn)
  ![GitHub pull requests](https://img.shields.io/github/issues-pr/SuperteamDAO/earn)
  [![Follow](https://img.shields.io/twitter/follow/superteamearn.svg?style=social)](https://twitter.com/superteamearn)
</div>

## Development Setup

### Prerequisites

- NodeJS
- MySQL
- pnpm

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
  - Use `openssl rand -base64 32` to generate a key and add it under `NEXTAUTH_SECRET` in the .env file.
  - Database setup
    - Create a local `MySQL` instance and replace `<user>`, `<pass>`, `<db-host>`, and `<db-port>` with their applicable values.
      ```
      LOCAL_DATABASE_URL='mysql://<user>:<pass>@<db-host>:<db-port>'
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

  NOTE: If you are facing any issues with setup, feel free to contact [Abhishek](https://twitter.com/abhwshek)

5. Run the development server
    ```bash
    pnpm dev
    ```

## Contributing
We welcome contributions from everyone! Whether it's submitting an issue, a pull request, or suggesting new ideas, your input is highly valued. Check out our [contributing guide](CONTRIBUTING.md) for guidelines on how to proceed.

Facing an issue? Please feel free to reach out to [Abhishek](https://twitter.com/abhwshek) or [Pratik](https://twitter.com/pratikdholani)

### Why should you contribute to Earn?
- Consistent, good-quality contributions will earn you [contributor](https://docs.superteam.fun/the-superteam-handbook/getting-started/community-structure) status in the Superteam of your preference! Contributors get special access to channels on Discord, preferential entry to events, and is a great stepping stone to becoming a Superteam member.
- Get [XP](https://docs.superteam.fun/the-superteam-handbook/community/the-reputation-system) if you're already a Superteam Member or Contributor
- Unwavering love and support from the Superteam Earn team!

### Contributors
<a href="https://github.com/SuperteamDAO/earn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SuperteamDAO/earn" />
</a>

## Repo Activity

<img width="100%" src="https://repobeats.axiom.co/api/embed/a82375612cac34000c44afc158c634bc0802a712.svg" />
