cask "deskfleet" do
  arch arm: "arm64", intel: "x64"

  version "0.23.0"
  sha256 arm:   "18c2a94b6221f3f0e4d49833498a4fd823e2dff66262110f942b3ee5b41c8659",
         intel: "72ce0ad6580dd9d78032f7b900f4ab62437927c1633ed0a43ac47a9107b261bb"

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
