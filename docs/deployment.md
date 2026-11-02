# Deployment

Hosted on **Cloudflare Workers with static assets** (the current "Create app" flow, which replaces Pages). The Worker is named `portfolio`, is connected to the GitHub repository `mrjacksonsapien/portfolio`, and is served at **https://martinsoltan.com**.

## How it works

- Cloudflare watches the repository. A push or merge to the production branch `main` triggers a build, then a deploy.
- Build command: `npm run build` (output in `dist/`)
- Deploy command: `npx wrangler deploy`
- Preview command: `npx wrangler preview` (used for non-production branch builds, if enabled)
- Node version: 22, read from `.nvmrc`.
- No adapter is needed because the output is fully static. [wrangler.jsonc](../wrangler.jsonc) tells Wrangler to serve `dist/` as static assets. Its `name` must match the Worker name in the dashboard (`portfolio`).
- No build variables or bindings are configured.

## Release flow

1. Commit on `develop` and push.
2. Open a pull request `develop` -> `main` (`gh pr create --base main --head develop`).
3. The user merges it. Cloudflare builds and deploys within about a minute.

Agents never commit to `main`, and never accept, approve or merge a pull request (see `conventions.md`). Every push to `main` is a production deploy, so `main` changes only through merged PRs.

## Dashboard

- Builds and logs: Worker `portfolio` -> Deployments. "Retry build" replays the same branch and commit as the original build. To deploy new code, push or merge to `main`.
- Production branch: Settings -> Builds -> Branch control. It must stay `main`, otherwise pushes to `develop` would deploy to production.
- Domain: Settings -> Domains & Routes. `martinsoltan.com` is attached as a custom domain. The `workers.dev` address is disabled.

## Domain

`martinsoltan.com` is registered with Cloudflare Registrar, so DNS and HTTPS are managed by Cloudflare. Auto-renew is on. The yearly renewal is the only recurring cost. Hosting and builds are on the free plan.

## Agent and CLI access

Agents do not talk to Cloudflare directly. They only use git and `gh` (push to `develop`, open the PR). Deploys happen automatically after the user merges. Local `npx wrangler` commands are not needed.
