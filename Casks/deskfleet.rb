cask "deskfleet" do
  version "0.5.1"
  sha256 "a79455997b740364499a7e4c8d35d8eb05cd40f09bcea233a683d90427a080f9"

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
