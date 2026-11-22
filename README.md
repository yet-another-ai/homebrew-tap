# yet-another-ai Homebrew Tap

Install [DeskFleet](https://www.deskfleet.org/) on macOS 13 Ventura or later
(Apple Silicon and Intel).

## Desktop app

```sh
brew install --cask yet-another-ai/tap/deskfleet
```

DeskFleet can download and install updates from inside the application. To update
through Homebrew, quit DeskFleet from its tray menu and run:

```sh
brew update
brew upgrade --cask --greedy-auto-updates yet-another-ai/tap/deskfleet
```

Quit DeskFleet before uninstalling the application:

```sh
brew uninstall --cask yet-another-ai/tap/deskfleet
```

Uninstalling preserves workspaces, worktrees, and application data. Closing an app
window keeps DeskFleet running in the tray.

## Headless daemon

For remote Macs without a desktop session, install the standalone daemon:

```sh
brew install yet-another-ai/tap/deskfleet-daemon
```

Enroll the machine before relying on it as a service (see the
[Daemon Guide](https://github.com/yet-another-ai/deskfleet/blob/main/apps/daemon/README.md)):

```sh
deskfleet-daemon prepare-enrollment --server-url https://backend.example --team-id <id>
deskfleet-daemon enroll --server-url https://backend.example < machine-credentials.json
```

Run in the foreground, or manage with Homebrew services after enrollment:

```sh
deskfleet-daemon
brew services start yet-another-ai/tap/deskfleet-daemon
```

## Release tracking

This Tap installs published macOS DMGs and daemon archives from
[DeskFleet releases](https://github.com/yet-another-ai/deskfleet/releases).
DeskFleet owns application versions and builds. This Tap reconciles packaging on
a weekday schedule and via manual workflow dispatch, then opens a pull request
for maintainer review.

Linux desktop and headless installs remain on AUR, Nix, AppImage, and the
versioned Linux archives from those releases—not this Tap.

For required checks, local commands, and manual synchronization, see
[Tap maintenance](agents/docs/maintenance.md).
