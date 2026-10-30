cask "deskfleet" do
  version "0.2.1"
  sha256 "391902f64895849f27b21374de79d046db0461cb78c61724d7e4495c53079d98"

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
