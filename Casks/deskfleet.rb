cask "deskfleet" do
  version "0.20.0"
  sha256 "4d7ea166cb2200455d2fbeb81d71eef1a170b17d45615e18b1cef294f70d7031"

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
