import assert from "node:assert/strict"
import { test } from "node:test"
import {
  caskIdentity,
  deskfleet,
  formulaIdentity,
  parseRelease,
  updateCask,
  updateFormula
} from "./release-policy.ts"

const oldArm = "a".repeat(64)
const oldIntel = "c".repeat(64)
const newArm = "b".repeat(64)
const newIntel = "d".repeat(64)

const cask = `cask "example" do
  arch arm: "arm64", intel: "x64"

  version "1.0.0"
  sha256 arm:   "${oldArm}",
         intel: "${oldIntel}"

  url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-#{version}-mac-#{arch}.dmg"
  app "DeskFleet.app"
end
`

const formula = `class DeskfleetDaemon < Formula
  desc "Headless DeskFleet machine daemon"
  homepage "https://www.deskfleet.org/"
  version "1.0.0"
  license "Apache-2.0"

  depends_on :macos

  on_macos do
    on_arm do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-arm64.tar.gz"
      sha256 "${oldArm}"
    end

    on_intel do
      url "https://github.com/yet-another-ai/deskfleet/releases/download/v#{version}/deskfleet-macos-x64.tar.gz"
      sha256 "${oldIntel}"
    end
  end

  def install
    bin.install "deskfleet-daemon"
  end
end
`

function releaseAsset(name: string, digest: string, version = "1.1.0") {
  return {
    name,
    state: "uploaded",
    browser_download_url: `https://github.com/${deskfleet.upstream}/releases/download/v${version}/${name}`,
    size: 123,
    digest: `sha256:${digest}`
  }
}

function release(
  version = "1.1.0",
  digests = { desktopArm: newArm, desktopIntel: newIntel, daemonArm: newArm, daemonIntel: newIntel }
) {
  return {
    draft: false,
    prerelease: false,
    tag_name: `v${version}`,
    assets: [
      releaseAsset(deskfleet.desktopAsset(version, "arm64"), digests.desktopArm, version),
      releaseAsset(deskfleet.desktopAsset(version, "x64"), digests.desktopIntel, version),
      releaseAsset(deskfleet.daemonAsset("arm64"), digests.daemonArm, version),
      releaseAsset(deskfleet.daemonAsset("x64"), digests.daemonIntel, version)
    ]
  }
}

test("uses GitHub digests for Apple Silicon and Intel desktop DMGs", () => {
  const next = updateCask(cask, parseRelease(release()))
  assert.deepEqual(caskIdentity(next), { version: "1.1.0", arm64: newArm, x64: newIntel })
  assert.equal(
    next
      .replace('  version "1.1.0"', '  version "1.0.0"')
      .replace(newArm, oldArm)
      .replace(newIntel, oldIntel),
    cask
  )
})

test("uses GitHub digests for Apple Silicon and Intel daemon archives", () => {
  const next = updateFormula(formula, parseRelease(release()))
  assert.deepEqual(formulaIdentity(next), { version: "1.1.0", arm64: newArm, x64: newIntel })
  assert.equal(
    next
      .replace('  version "1.1.0"', '  version "1.0.0"')
      .replace(newArm, oldArm)
      .replace(newIntel, oldIntel),
    formula
  )
})

test("a repeated release leaves the Cask and formula unchanged", () => {
  const metadata = parseRelease(
    release("1.0.0", {
      desktopArm: oldArm,
      desktopIntel: oldIntel,
      daemonArm: oldArm,
      daemonIntel: oldIntel
    })
  )
  assert.equal(updateCask(cask, metadata), cask)
  assert.equal(updateFormula(formula, metadata), formula)
})

test("rejects downgrades and same-version digest changes", () => {
  assert.throws(() => updateCask(cask, parseRelease(release("0.9.0"))), /downgrade/)
  assert.throws(() => updateFormula(formula, parseRelease(release("0.9.0"))), /downgrade/)
  assert.throws(() => updateCask(cask, parseRelease(release("1.0.0"))), /Published bytes changed/)
  assert.throws(
    () => updateFormula(formula, parseRelease(release("1.0.0"))),
    /Published bytes changed/
  )
})

test("requires GitHub's SHA-256 digest on every tracked asset", () => {
  for (const digest of [undefined, null, "", `sha512:${newArm}`, `sha256:${newArm.slice(1)}`]) {
    const metadata = release()
    assert.throws(
      () => parseRelease({ ...metadata, assets: [{ ...metadata.assets[0], digest }] }),
      /Invalid GitHub asset digest/
    )
  }
})

test("requires uploaded Apple Silicon and Intel desktop and daemon assets", () => {
  const metadata = release()
  for (const override of [
    { name: "deskfleet-1.1.0-mac-arm64.zip" },
    { state: "new" },
    { browser_download_url: "https://example.com/DeskFleet.dmg" },
    { size: 0 }
  ]) {
    assert.throws(() =>
      parseRelease({
        ...metadata,
        assets: [{ ...metadata.assets[0], ...override }, ...metadata.assets.slice(1)]
      })
    )
  }
  assert.throws(
    () => parseRelease({ ...metadata, assets: metadata.assets.slice(0, 3) }),
    /Expected exactly one/
  )
})

test("requires a published stable release version", () => {
  const metadata = release()
  for (const override of [{ draft: true }, { prerelease: true }, { tag_name: "v1.1.0-beta.1" }]) {
    assert.throws(() => parseRelease({ ...metadata, ...override }))
  }
})
