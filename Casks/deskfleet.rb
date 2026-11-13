cask "deskfleet" do
  version "0.16.0"
  sha256 "df63a541159474e2c5500fdd5cb1d33d7f79a550f8a4648ba722811a9b2e6756"

  url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-#{version}-mac-arm64.dmg"
  name "DeskFleet"
  desc "Manage a team's AI agents and working environments across machines"
  homepage "https://www.deskfleet.org/"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on arch: :arm64
  depends_on macos: :ventura

  app "DeskFleet.app"
end
