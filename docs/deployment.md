# Deployment

Hosted on **Cloudflare Workers with static assets** (the current "Create app" flow replaces Pages). The Worker is named `portfolio` and is connected to the GitHub repository `mrjacksonsapien/portfolio`.

## Setup

- Production branch: `main`. Merging a pull request into `main` triggers a build and deploy.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler preview`
- Node version: 22 (see `.nvmrc`)
- No adapter is needed because the output is fully static. [wrangler.jsonc](../wrangler.jsonc) tells Wrangler to serve `dist/` as static assets. Its `name` must match the project name in the dashboard.

## Release flow

1. Commit on `develop` and push.
2. Open a pull request `develop` -> `main`.
3. The user merges it. Cloudflare builds and deploys.

Agents never commit to `main` or merge the pull request (see `conventions.md`).

## Domain

The custom domain is registered with Cloudflare Registrar and attached under the Worker's Settings -> Domains & Routes -> Custom domain. Auto-renew is on, so the yearly renewal is the only recurring cost.

## To document once it is live

- Final URLs (`*.workers.dev` and the custom domain)
- Preview deployments for other branches
- How agents and humans interact with the service (API and CLI requests)
