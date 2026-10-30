# Tap maintenance

## Ownership and publication

DeskFleet owns its version, release tags, packaging, signing, notarization, and
release assets. This Tap owns installation instructions and synchronization. The
cask tracks the latest published stable release selected by the GitHub Releases
API.

| Product   | Dispatch event                | Sync workflow        | Cask                 | Asset                           |
| --------- | ----------------------------- | -------------------- | -------------------- | ------------------------------- |
| DeskFleet | `deskfleet-release-published` | `sync-deskfleet.yml` | `Casks/deskfleet.rb` | `deskfleet-<ver>-mac-arm64.dmg` |

DeskFleet sends its dispatch after a stable release is published. The Tap treats
that event as a wake-up signal and queries upstream again. Delayed older
notifications synchronize the current release. Drafts, prereleases, incomplete
assets, noncanonical URLs, downgrades, and changed bytes at the same version are
rejected.

`scripts/sync-deskfleet.ts` reads the Apple Silicon DMG's SHA-256 digest from
GitHub's Releases API and writes it into the cask. GitHub generates the digest
when the asset is uploaded; Homebrew verifies the installer during installation.
Release metadata must remain unchanged before the cask is replaced atomically.
Only `version` and `sha256` are updated; installation settings remain intact.

Successful synchronization creates or updates the fixed PR branch
`dsh0416/update-deskfleet`. Repeated notifications create no additional PRs or
commits. Required CI checks gate auto-merge. Failures leave the published cask
intact. The Tap can briefly lag a release; there is no scheduled reconciliation.

The current cask requires Apple Silicon and macOS 13 Ventura or later. DeskFleet
v0.2.1 uses Electron 45; [Electron 44 and later require macOS 13](https://www.electronjs.org/blog/electron-44-0).
When upstream changes its supported platforms, review these requirements along
with the cask. The cask has no `zap` stanza: DeskFleet's application profile can
contain session worktrees and must survive uninstallation.

## One-time credential setup

Create a fine-grained personal access token:

1. Set resource owner to `yet-another-ai` and select only `homebrew-tap`.
2. Grant **Contents: Read and write** and **Pull requests: Read and write**.
   Metadata read access is implicit. DeskFleet repository write access is not
   needed.
3. Complete organization approval if the token is shown as pending.
4. Add the token as Actions secret `TAP_SYNC_TOKEN` in `yet-another-ai/deskfleet`
   and `yet-another-ai/homebrew-tap`, or use an organization secret visible to
   exactly these repositories.
5. Renew the token before expiration and replace the secrets.

DeskFleet uses the token for repository dispatch. The Tap uses it to push the
release branch, create or update the PR, and enable auto-merge. Public upstream
metadata is fetched without credentials.

The default `GITHUB_TOKEN` is limited to its own repository. A PAT enables the
cross-repository notification and allows PR checks to run. See
[GitHub's token documentation](https://docs.github.com/en/actions/concepts/security/github_token)
and [dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event).

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

If a newer stable release appears during synchronization, dispatch again to
refresh that same PR. Normal release notifications do this automatically; a lost
notification needs a manual retry. Intentional rollbacks and same-version
replacements require investigation and a reviewed change.

## Bootstrap and manual retry

Dispatch workflows must be on their repositories' default branches.

Run from any GitHub-authenticated checkout:

```sh
gh workflow run sync-deskfleet.yml --repo yet-another-ai/homebrew-tap --ref main
```

To retry the upstream notification:

```sh
gh workflow run notify-homebrew-tap.yml --repo yet-another-ai/deskfleet --ref main
```

Both paths reconcile the current stable release without a manually supplied
version. Missing or expired credentials fail the workflow; replace the secret
and retry.

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
