class DeskfleetDaemon < Formula
  desc "Headless DeskFleet machine daemon"
  homepage "https://www.deskfleet.org/"
  version "0.24.0"
  license "Apache-2.0"

  depends_on :macos

  on_macos do
    on_arm do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-arm64.tar.gz"
      sha256 "acf1eb6eacd882fd99e51c3707430b50e47b3763791659bcceac84377e6b3d22"
    end

    on_intel do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-x64.tar.gz"
      sha256 "c9a485949375e90078e09e96d9aac905766f1bd2b34bb6ec809bf041dd89d929"
    end
  end

  livecheck do
    url "https://github.com/yet-another-ai/deskfleet/releases/latest"
    strategy :github_latest
  end

  def install
    bin.install "deskfleet-daemon"
  end

  service do
    run [opt_bin/"deskfleet-daemon"]
    keep_alive true
    working_dir var
    log_path var/"log/deskfleet-daemon.log"
    error_log_path var/"log/deskfleet-daemon.log"
  end

  def caveats
    <<~EOS
      The daemon stores machine data under ~/.deskfleet by default
      (override with DESKFLEET_DAEMON_DIRECTORY). Enroll the machine before
      relying on brew services; see:
        https://github.com/yet-another-ai/deskfleet/blob/main/apps/daemon/README.md

      Start in the foreground:
        deskfleet-daemon

      Or manage with Homebrew services:
        brew services start yet-another-ai/tap/deskfleet-daemon
    EOS
  end

  test do
    assert_match '"runtime"', shell_output("#{bin}/deskfleet-daemon --info")
  end
end
