# yet-another-ai Homebrew Tap

Install [DeskFleet](https://www.deskfleet.org/), a desktop application for managing
a team's AI agents and working environments across machines, on Apple Silicon
Macs running macOS 13 Ventura or later.

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

## Release tracking

This Tap installs the published Apple Silicon macOS DMG from
[DeskFleet releases](https://github.com/yet-another-ai/deskfleet/releases).
DeskFleet owns application versions and builds. This Tap reconciles the cask on
a weekday schedule and via manual workflow dispatch, then opens a pull request
for maintainer review.

For required checks, local commands, and manual synchronization, see
[Tap maintenance](agents/docs/maintenance.md).
