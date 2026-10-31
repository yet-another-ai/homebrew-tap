# Agent guide

This repository owns Homebrew packaging for yet-another-ai applications. Each
product's published stable GitHub Release is the version authority; do not add a
separate VERSION file, rebuild upstream projects, or track their development
branches.

- Keep casks in `Casks/`, automation in `.github/workflows/`, and maintainer
  documentation in `agents/docs/`.
- Run tooling through `mise` and preserve `mise.lock` and `pnpm-lock.yaml`.
- Reference GitHub Actions by their version tags when available, not commit hashes.
- On Windows use PowerShell 7 with its normal profile.
- Keep Node scripts in erasable TypeScript and validate with `mise run check`.
- Keep CI focused on utility type checking, formatting, and Ruby syntax. Upstream
  release pipelines own application builds, signing, and
  notarization. Synchronization uses each Apple Silicon DMG digest supplied by
  GitHub's Release API; Homebrew verifies the installer when installing it.
- Do not add tests that restate Cask contents or implementation details, or
  duplicate upstream Homebrew validation and upstream application checks.
- Keep schedule and manual `workflow_dispatch` as the sync triggers. Upstream
  application repos do not wake this Tap and must not hold Tap credentials.
- Preserve application installation settings when updating a release. Projects
  and user data must not be removed by uninstall or a broad `zap` definition.
- Never put credentials in source. Sync PRs use the default `GITHUB_TOKEN` and
  stop for manual review; do not add a Tap sync PAT or GitHub App for this
  path. Details are in `agents/docs/maintenance.md`.
