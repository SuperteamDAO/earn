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

4. Set up your `.env` File.
  - Start by copying the `.env.example` file to a new file named `.env`. This file will store your local environment variables.
  - You have to set up resend for email authentication:
    - Go to the [Resend website](https://resend.com) and log in or create an acount.
    - Once logged in, navigate to the dashboard and generate a new API key. This key will be used to authenticate your application's requests to Resend.
    - Add your email domain to Resend. Go to the [domains section](https://resend.com/domains) on the Resend website and register the domain of your email address. This step is necessary for sending emails through Resend
  - Update your `.env` File:
    - In your `.env` file, you need to add two key-value pairs:
      - `RESEND_API_KEY`: Set this to the API key you generated on the Resend dashboard.
      - `RESEND_EMAIL`: Use the email address that corresponds to the domain you registered on Resend.


5. Run the development server
```bash
pnpm dev
```

## Contributing
We welcome contributions from everyone! Whether it's submitting an issue, a pull request, or suggesting new ideas, your input is highly valued. Check out our [contributing guide](CONTRIBUTING.md) for guidelines on how to proceed.

Facing an issue? Please feel free to reach out to [Abhishek](https://twitter.com/abhwshek) or [Pratik](https://twitter.com/pratikdholani)

### Contributors
<a href="https://github.com/SuperteamDAO/earn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SuperteamDAO/earn" />
</a>

## Repo Activity

<img width="100%" src="https://repobeats.axiom.co/api/embed/a82375612cac34000c44afc158c634bc0802a712.svg" />
