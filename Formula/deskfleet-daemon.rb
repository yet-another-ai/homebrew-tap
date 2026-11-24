class DeskfleetDaemon < Formula
  desc "Headless DeskFleet machine daemon"
  homepage "https://www.deskfleet.org/"
  version "0.23.0"
  license "Apache-2.0"

  depends_on :macos

  on_macos do
    on_arm do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-arm64.tar.gz"
      sha256 "b0e9cb80d5f11969e64575bd7e2c2fba3095a6e96986aecbbb28e5f25cf6b69b"
    end

    on_intel do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-x64.tar.gz"
      sha256 "f32d24d5efa8f712aefd6a2de9095a0b36bb9ba13e5a42e3ccb848f1e92dd352"
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
