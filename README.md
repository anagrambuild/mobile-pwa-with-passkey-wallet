# Mobile PWA with Embedded Wallet - Starter Template

This repository contains a ready-to-use modern crypto mobile [PWA](https://web.dev/progressive-web-apps/) using the latest technologies including embedded [passkey](https://docs.turnkey.com/passkeys/introduction) wallets and mobile [push notifications](https://web.dev/notifications/).

Use this repo to skip all the tedious set up, plumbing, and configuration.
Fork the repo (or copy and paste the parts you need), layer in your smart contracts and business logic, and start shipping to your users.

## Demo

Try out a basic demo on your phone. Visit [pwawallet.xyz](https://pwawallet.xyz) on mobile safari and install the PWA to your homepage. Push notifications on iPhone requires iOS `>=16.4`.

## What can you do with this repository?

- Build a [FriendTech](https://friend.tech) clone
- Bring your own smart contracts and build your own crypto mobile PWA app
- Fork it and explore how a modern mobile-focused crypto PWA works

## Features:

This repo is an end-to-end app that implements the following core PWA mobile stack features:

- Mobile-focused PWA;
- Push notifications configured for iOS and Android
- Embedded non-custodial wallet via mobile passkey (with opt-in iCloud recovery)
- Web 2 Auth/Social integration layer
- Supports L2s (and any EVM chains) for low fees and fast UX (optional)

### And additional affordances:

- Service workers all configured and set up correctly.
- Automatically manages PWA updates; Prompts user to update whenever there is a new PWA version pushed live.
- Clerk user management works out of the box: supports social auth (Twitter, Discord), Username based auth, or Phone number based auth
- Ready-to-use mobile design system using Tailwind with mobile component library Konsta [shadcn of mobile]) so you can get productive fast.

## Set up

Let's set up the application. This requires some one-time configuration for certain services.

### Clone repository

Clone the repository:

```sh
git clone https://github.com/anagrambuild/mobile-pwa-with-wallet
```

Install the dependencies

```sh
pnpm i
```

### One-time set up services and API keys

#### Web-Push (Mobile push notifications)

Let's set up the keypair required for push notifications.

```sh
pnpm webpush:generate-keys
```

Put the generated public and private keys in your `.env` under `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` and `WEB_PUSH_PRIVATE_KEY` respectively.

Also, set the `WEB_PUSH_SUBJECT` to your production domain.

#### Turnkey (Passkey wallet)

Now let's sign up for our secure wallet infrastructure service, [TurnKey](https://turnkey.com).

Go to Turnkey.com and create an Organization for free. Find the Organization ID and add that to your .env under `TURNKEY_ORGANIZATION_ID`

Then run the following commands:

```sh
pnpm turnkey:install
pnpm turnkey:create:api-key
pnpm turnkey:create:private-key
```

Add the generated key pair result of those commands to `TURNKEY_API_PUBLIC_KEY`, `TURNKEY_API_PRIVATE_KEY` in your `.env` file

#### PlanetScale (Database)

Let's set up our database hosting for our offchain data (users, push notifications, etc)
We'll use [PlanetScale](https://planetscale.com) for their serverless MySQL hosting. If you prefer Postgres, we recommend [neon](https://neon.tech/) for serverless db hosting. Or you can always bring your own SQL database connection if you have an existing database.

To set up the database schema, run:

```sh
pnpm db:push
```

You can also inspect and view/edit your database visually using the local Drizzle Studio by running:

```sh
pnpm db:studio
```

#### Clerk (Web2 Auth)

Go to clerk.com and set up an account.

Add API keys to .env

```sh
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

Enable and configure the types of web2 authentication you'd like to use within Clerk (e.g. Twitter, Discord, Phone Number, or just plain username)

#### Web3 (Viem/Wagmi codegen)

To generate the web3 code (hooks, etc) via Wagmi CLI, run the following command:

```sh
pnpm web3:codegen
```

That's it, you're now set up.

### Start local dev server

Now you're ready to start the server and get to coding!

```sh
pnpm dev
```

And you should be able to access your PWA at localhost:3000

## Technologies

- [Next](https://nextjs.org/) 13 - Page dir and app dir both work
- [Turnkey](https://turnkey.com) - Passkey non-custodial wallets
- [Clerk](https://clerk.com/) - Web2 Auth
- [Tailwind](https://tailwindcss.com/) and with [Konsta](https://konstaui.com/) - Styling
- [PlanetScale](https://planetscale.com/) - Serverless database hosting
- [Drizzle](https://orm.drizzle.team/) - Database ORM
- [Vercel](https://vercel.com) - Deployment
- [Viem](#) and [Wagmi](#) - Web3 library

## Credits

- anagram.xyz - engineering group
