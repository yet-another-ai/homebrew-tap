# Tap maintenance

## Ownership and publication

DeskFleet owns its version, release tags, packaging, signing, notarization, and
release assets. This Tap owns installation instructions and synchronization. The
cask tracks the latest published stable release selected by the GitHub Releases
API.

| Product   | Sync triggers                         | Sync workflow        | Cask                 | Asset                           |
| --------- | ------------------------------------- | -------------------- | -------------------- | ------------------------------- |
| DeskFleet | weekday schedule + `workflow_dispatch` | `sync-deskfleet.yml` | `Casks/deskfleet.rb` | `deskfleet-<ver>-mac-arm64.dmg` |

Synchronization is tap-owned. A weekday cron (every two hours) and manual
`workflow_dispatch` wake the sync workflow. DeskFleet does not notify this Tap
and does not hold Tap credentials. Delayed runs still query upstream and
synchronize the current stable release. Drafts, prereleases, incomplete assets,
noncanonical URLs, downgrades, and changed bytes at the same version are
rejected.

`scripts/sync-deskfleet.ts` reads the Apple Silicon DMG's SHA-256 digest from
GitHub's Releases API and writes it into the cask. GitHub generates the digest
when the asset is uploaded; Homebrew verifies the installer during installation.
Release metadata must remain unchanged before the cask is replaced atomically.
Only `version` and `sha256` are updated; installation settings remain intact.

Successful synchronization creates or updates the fixed PR branch
`dsh0416/update-deskfleet`. Repeated runs create no additional PRs or commits
when the cask is already current. Required CI checks gate auto-merge. Failures
leave the published cask intact. The Tap can briefly lag a release until the
next schedule or manual dispatch.

The current cask requires Apple Silicon and macOS 13 Ventura or later. DeskFleet
v0.2.1 uses Electron 45; [Electron 44 and later require macOS 13](https://www.electronjs.org/blog/electron-44-0).
When upstream changes its supported platforms, review these requirements along
with the cask. The cask has no `zap` stanza: DeskFleet's application profile can
contain session worktrees and must survive uninstallation.

## One-time GitHub App setup

Use a GitHub App installed only on this Tap to open sync PRs and enable
auto-merge. Do not use a personal access token, and do not store Tap credentials
in DeskFleet.

1. Register a GitHub App under the `yet-another-ai` organization (or transfer it
   there). Suggested name: `homebrew-tap-sync`. Leave webhooks disabled unless
   you need them for another purpose.
2. Set repository permissions to **Contents: Read and write** and
   **Pull requests: Read and write**. Metadata read access is implicit. Do not
   grant DeskFleet or other repositories access.
3. Generate a private key and download the `.pem` file. Copy the App **Client
   ID** from the App settings page (prefer Client ID over the numeric App ID).
4. Install the App on `yet-another-ai/homebrew-tap` only.
5. In `yet-another-ai/homebrew-tap` Actions settings:
   - Add repository variable `APP_CLIENT_ID` with the Client ID.
   - Add repository secret `APP_PRIVATE_KEY` with the full PEM contents,
     including the `BEGIN`/`END` lines.
6. Remove any legacy `TAP_SYNC_TOKEN` secrets from this Tap and from DeskFleet
   if they still exist. DeskFleet no longer needs a Tap token for releases.

The sync workflow uses
[`actions/create-github-app-token`](https://github.com/actions/create-github-app-token)
to mint a short-lived installation token, then
[`peter-evans/create-pull-request`](https://github.com/peter-evans/create-pull-request)
and `gh pr merge --auto` with that token. An App token allows the Utilities
workflow to run on the sync PR; PRs created with the default `GITHUB_TOKEN` do
not start repository workflows. Missing `APP_CLIENT_ID` or `APP_PRIVATE_KEY`
fails the job with a clear error pointing here.

Public upstream release metadata is fetched without credentials.

## Required repository settings

After publishing the initial Tap files and running **Check utilities** once:

1. Enable **Allow auto-merge** and **Allow squash merging** in Settings → General.
2. Add classic branch protection for `main`, requiring a pull request and the
   `Utilities` check.
3. Require the branch to be up to date before merging. Leave required approving
   reviews disabled if release PRs should merge without manual review.

Use the exact check name above. Keep the fixed automation branch outside the
protected branch pattern: updating its PR may require a force push. Before
requesting auto-merge, the sync workflow checks that auto-merge is enabled and
the required `Utilities` check protects `main`. Missing settings fail the run
and leave the PR available for review.

If a newer stable release appears before the next scheduled run, dispatch the
sync workflow manually to refresh that same PR. Intentional rollbacks and
same-version replacements require investigation and a reviewed change.

## Bootstrap and manual retry

The sync workflow must exist on the repository default branch for schedule and
manual runs.

Run from any GitHub-authenticated checkout after a DeskFleet release, or when
credentials or branch protection were fixed:

```sh
gh workflow run sync-deskfleet.yml --repo yet-another-ai/homebrew-tap --ref main
```

This reconciles the current stable release without a manually supplied version.
Missing App credentials fail the workflow; complete the one-time App setup above
and retry. DeskFleet has no companion notify workflow for this Tap.

## Local validation

```sh
mise install --locked
mise run check
```

`check` runs formatting, TypeScript checks, and release-policy tests. CI also runs
`ruby -c` on every file under `Casks/`. Upstream release pipelines own application
building, signing, and notarization.

```sh
mise run sync
```

This updates the local cask from the latest stable release's DMG digest.

On an Apple Silicon Mac, tap the local checkout before checking or installing it:

```sh
brew tap yet-another-ai/tap "$PWD"
brew style Casks/deskfleet.rb
brew audit --cask --new --online yet-another-ai/tap/deskfleet
brew install --cask yet-another-ai/tap/deskfleet
```

Quit DeskFleet from its tray menu before uninstalling:

```sh
brew uninstall --cask yet-another-ai/tap/deskfleet
```

Untap an existing yet-another-ai Tap first, or Homebrew will keep its previous
checkout. Manual installation checks require a supported Mac.
