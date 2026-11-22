# Tap maintenance

## Ownership and publication

DeskFleet owns its version, release tags, packaging, signing, notarization, and
release assets. This Tap owns installation instructions and synchronization. The
cask and daemon formula track the latest published stable release selected by the
GitHub Releases API.

| Product           | Sync triggers                          | Sync workflow        | Package                       | Assets                                                         |
| ----------------- | -------------------------------------- | -------------------- | ----------------------------- | -------------------------------------------------------------- |
| DeskFleet desktop | weekday schedule + `workflow_dispatch` | `sync-deskfleet.yml` | `Casks/deskfleet.rb`          | `deskfleet-<ver>-mac-arm64.dmg`, `deskfleet-<ver>-mac-x64.dmg` |
| DeskFleet daemon  | same workflow                          | `sync-deskfleet.yml` | `Formula/deskfleet-daemon.rb` | `deskfleet-macos-arm64.tar.gz`, `deskfleet-macos-x64.tar.gz`   |

Synchronization is tap-owned. A weekday cron (every two hours) and manual
`workflow_dispatch` wake the sync workflow. DeskFleet does not notify this Tap
and does not hold Tap credentials. Delayed runs still query upstream and
synchronize the current stable release. Drafts, prereleases, incomplete assets,
noncanonical URLs, downgrades, and changed bytes at the same version are
rejected. Both Apple Silicon and Intel desktop DMGs plus both macOS daemon
archives must be present before packaging advances.

`scripts/sync-deskfleet.ts` reads each tracked asset's SHA-256 digest from
GitHub's Releases API and writes it into the cask and formula. GitHub generates
the digest when the asset is uploaded; Homebrew verifies installers during
installation. Release metadata must remain unchanged before files are replaced
atomically. Only `version` and architecture checksums are updated; installation
settings remain intact.

Successful synchronization creates or updates the fixed PR branch
`dsh0416/update-deskfleet` using the default `GITHUB_TOKEN`. Repeated runs create
no additional PRs or commits when packaging is already current. The workflow
stops after opening or updating the PR; it does not enable auto-merge. A
maintainer reviews and merges. Failures leave the published packaging intact. The
Tap can briefly lag a release until the next schedule or manual dispatch.

PRs created with `GITHUB_TOKEN` do not trigger repository workflows the same way
a personal access token or GitHub App token would. Required checks such as
Utilities may not run automatically on the sync PR. Review the packaging diff and
merge manually; run local validation or re-run checks if you need CI signal
before merging.

No GitHub App and no `TAP_SYNC_TOKEN` (or other long-lived PAT) are required for
sync. Remove any legacy Tap sync secrets from this repository and from DeskFleet
if they still exist. Public upstream release metadata is fetched without
credentials.

The desktop cask requires macOS 13 Ventura or later on Apple Silicon and Intel.
DeskFleet v0.2.1 uses Electron 45; [Electron 44 and later require macOS 13](https://www.electronjs.org/blog/electron-44-0).
When upstream changes its supported platforms, review these requirements along
with the cask. The cask has no `zap` stanza: DeskFleet's application profile can
contain session worktrees and must survive uninstallation.

The daemon formula installs only `deskfleet-daemon` from the macOS server/daemon
archive (it does not install `deskfleet-server`). The binary accepts
`--port`, `--info`, and enrollment subcommands documented upstream; do not invent
additional service flags. Default data lives under `~/.deskfleet`. Linux
packaging remains outside this Tap (AUR, Nix, and release archives).

## Required repository settings

After publishing the initial Tap files and running **Check utilities** once:

1. Enable **Allow GitHub Actions to create and approve pull requests** under
   Settings → Actions → General → Workflow permissions (repository and/or
   organization). The sync workflow already requests `contents: write` and
   `pull-requests: write` on the default `GITHUB_TOKEN`. Without this Actions
   setting, synchronization can still update the fixed branch
   `dsh0416/update-deskfleet`, but **Create or update release PR** fails with
   `GitHub Actions is not permitted to create or approve pull requests`. Do not
   work around that failure with a Tap sync PAT, GitHub App, or DeskFleet-side
   notify job.
2. Enable **Allow squash merging** in Settings → General. Auto-merge is not
   required for sync PRs.
3. Add classic branch protection for `main` if you want pull requests and the
   `Utilities` check on human-authored changes. Sync PRs opened with
   `GITHUB_TOKEN` may not exercise those checks automatically.
4. Keep the fixed automation branch outside the protected branch pattern:
   updating its PR may require a force push.

If a newer stable release appears before the next scheduled run, dispatch the
sync workflow manually to refresh that same PR. Intentional rollbacks and
same-version replacements require investigation and a reviewed change.

## Bootstrap and manual retry

The sync workflow must exist on the repository default branch for schedule and
manual runs.

Run from any GitHub-authenticated checkout after a DeskFleet release:

```sh
gh workflow run sync-deskfleet.yml --repo yet-another-ai/homebrew-tap --ref main
```

This reconciles the current stable release without a manually supplied version
and opens or updates the sync PR for manual review. DeskFleet has no companion
notify workflow for this Tap.

## Local validation

```sh
mise install --locked
mise run check
```

`check` runs formatting, TypeScript checks, and release-policy tests. CI also runs
`ruby -c` on every file under `Casks/` and `Formula/`. Upstream release pipelines
own application building, signing, and notarization.

```sh
mise run sync
```

This updates the local cask and daemon formula from the latest stable release's
GitHub digests.

On a supported Mac, tap the local checkout before checking or installing:

```sh
brew tap yet-another-ai/tap "$PWD"
brew style Casks/deskfleet.rb Formula/deskfleet-daemon.rb
brew audit --cask --new --online yet-another-ai/tap/deskfleet
brew audit --formula --online yet-another-ai/tap/deskfleet-daemon
brew install --cask yet-another-ai/tap/deskfleet
brew install yet-another-ai/tap/deskfleet-daemon
```

Quit DeskFleet from its tray menu before uninstalling the app:

```sh
brew uninstall --cask yet-another-ai/tap/deskfleet
```

Untap an existing yet-another-ai Tap first, or Homebrew will keep its previous
checkout. Manual installation checks require a supported Mac.
