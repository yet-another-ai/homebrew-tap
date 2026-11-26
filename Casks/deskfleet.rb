cask "deskfleet" do
  arch arm: "arm64", intel: "x64"

  version "0.24.0"
  sha256 arm:   "e7a1b45f5aa9bcfd5926653c8402320efdf7a0e0d11779db14d3ca276432c92e",
         intel: "93dc8919125d3d6c58323eec844231eeb5e7d75d7cbc53a9a181b2826db69fde"

  url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-#{version}-mac-#{arch}.dmg"
  name "DeskFleet"
  desc "Manage a team's AI agents and working environments across machines"
  homepage "https://www.deskfleet.org/"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: :ventura

  app "DeskFleet.app"
end
