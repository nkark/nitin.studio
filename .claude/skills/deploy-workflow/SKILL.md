---
name: deploy-workflow
description: Deployment workflow for the nitin.studio personal website. Use when making changes, committing, pushing, or deploying this repo - explains branch strategy (main = development, release = production), how deploys work via Cloudflare Pages, and infrastructure details.
---

# nitin.studio Deploy Workflow

## Project Overview

- **Site**: Personal website for Nitin, live at https://nitin.studio
- **Stack**: Plain static HTML/CSS (`index.html`, `style.css`). No build step, no framework.
- **Local path**: `~/nitin.studio`
- **Repo**: `github.com/nkark/nitin.studio` (remote `origin`, HTTPS)

## Hosting Infrastructure

- **Host**: Cloudflare Pages (project name: `nitin-studio`)
- **Production URL**: https://nitin.studio (custom domain)
- **Preview URL**: https://nitin-studio.pages.dev
- **Build settings**: Framework preset None, build command empty, output directory `/` (repo root)
- **DNS**: Domain registered at Porkbun; nameservers point to Cloudflare (`daphne.ns.cloudflare.com`, `kyrie.ns.cloudflare.com`). All DNS records are managed in the Cloudflare dashboard, NOT Porkbun.
- **SSL**: Automatic via Cloudflare.

## Branch Strategy (IMPORTANT)

- `main` = development branch. Pushes here trigger **preview deployments** only.
- `release` = production branch. Whatever is on `release` goes live at nitin.studio.

**Only merge/push to `release` when changes are verified and ready for production.**

## Deployment Steps

1. Do work on `main` (or feature branches), commit, push to `origin/main`.
2. Verify the preview deployment looks correct.
3. When ready for production:
   ```
   git checkout release
   git merge main
   git push origin release
   git checkout main
   ```
4. Confirm https://nitin.studio reflects the change.

## Gotchas

- **Git auth**: Push over HTTPS using the `gh` credential helper (account `nkark`). The machine's SSH key belongs to a different GitHub account (`felixbuildthings`) and will be denied - do not switch the remote back to SSH.
- **Never edit DNS at Porkbun** - Porkbun is registrar only. DNS lives in Cloudflare.
- **No build/lint/test commands exist** - verify changes by opening the local files or checking the deployed site.
- Keep the site dependency-free (plain HTML/CSS) unless explicitly asked otherwise.
