cask "deskfleet" do
  version "0.4.0"
  sha256 "a3445bc26542bfaa46a61c0948d8e19dc653dcd3bfae7ab572408e2fa3767568"

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
