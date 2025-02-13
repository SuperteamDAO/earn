<div align="center">
  <br/>
  <img src="https://pbs.twimg.com/profile_images/1655546485365407744/dOeIC0R-_400x400.jpg" style="border-radius:10px" width="120px" height="auto"/>
  <h2>Nearn</h2>
  <p>
    <strong>An open source platform connecting crypto founders with elite talent to create bounties, and accelerate project completion</strong>
  </p>
  
  ![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)
  ![GitHub issues](https://img.shields.io/github/issues-raw/NEAR-DevHub/nearn)
  ![GitHub pull requests](https://img.shields.io/github/issues-pr/NEAR-DevHub/nearn)
</div>

## Development Setup

### Prerequisites

- NodeJS
- MySQL
- pnpm

### Getting Started

1. Clone the repository into a public Github repository (or fork it):
    ```bash
    git clone https://github.com/NEAR-DevHub/nearn.git
    ```

2. Navigate to the project directory:
    ```bash
    cd nearn
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

  NOTE: If you are facing any issues with setup, please create an issue and we will try to help you out.

5. Run the development server
    ```bash
    pnpm dev
    ```

## Contributing
We welcome contributions from everyone! Whether it's submitting an issue, a pull request, or suggesting new ideas, your input is highly valued. Check out our [contributing guide](CONTRIBUTING.md) for guidelines on how to proceed.

### Contributors
<a href="https://github.com/NEAR-DevHub/nearn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=NEAR-DevHub/nearn" />
</a>
