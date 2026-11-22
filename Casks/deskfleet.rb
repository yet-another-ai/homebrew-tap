cask "deskfleet" do
  arch arm: "arm64", intel: "x64"

  version "0.21.0"
  sha256 arm:   "b160b1a00da16741cf9b151ff5a74284ebbec8fb12efee49d55b83755cbcf5b1",
         intel: "9259e5fbba5c16ec4adcaf134148ca22db6478842938074bf494b4648678320d"

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
