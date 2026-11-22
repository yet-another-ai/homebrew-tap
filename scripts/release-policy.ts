export type MacArch = "arm64" | "x64"

export interface Product {
  upstream: string
  desktopAsset: (version: string, arch: MacArch) => string
  daemonAsset: (arch: MacArch) => string
}

export const deskfleet: Product = {
  upstream: "yet-another-ai/deskfleet",
  desktopAsset: (version, arch) => `deskfleet-${version}-mac-${arch}.dmg`,
  daemonAsset: (arch) => `deskfleet-macos-${arch}.tar.gz`
}

export function latestReleaseApiUrl(product: Product): string {
  return `https://api.github.com/repos/${product.upstream}/releases/latest`
}

export interface Asset {
  name: string
  url: string
  size: number
  sha256: string
}

export interface ArchAssets {
  arm64: Asset
  x64: Asset
}

export interface Release {
  tag: string
  version: string
  desktop: ArchAssets
  daemon: ArchAssets
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a GitHub release or asset object")
  }
  return value as Record<string, unknown>
}

function versionParts(version: string): bigint[] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Not a stable release version: ${version}`)
  }
  return version.split(".").map(BigInt)
}

export function compareVersions(left: string, right: string): number {
  const a = versionParts(left)
  const b = versionParts(right)
  for (let index = 0; index < 3; index++) {
    if (a[index]! < b[index]!) return -1
    if (a[index]! > b[index]!) return 1
  }
  return 0
}

function asset(product: Product, assets: unknown[], tag: string, name: string): Asset {
  const matches = assets.map(record).filter((item) => item.name === name)
  if (matches.length !== 1) throw new Error(`Expected exactly one release asset: ${name}`)
  const item = matches[0]!
  const url = `https://github.com/${product.upstream}/releases/download/${tag}/${name}`
  if (item.state !== "uploaded" || item.browser_download_url !== url) {
    throw new Error(`Release asset is not uploaded at its canonical URL: ${name}`)
  }
  if (typeof item.size !== "number" || !Number.isSafeInteger(item.size) || item.size <= 0) {
    throw new Error(`Invalid release asset size: ${name}`)
  }
  if (typeof item.digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(item.digest)) {
    throw new Error(`Invalid GitHub asset digest: ${name}`)
  }
  return { name, url, size: item.size, sha256: item.digest.slice(7) }
}

function archAssets(
  product: Product,
  assets: unknown[],
  tag: string,
  nameFor: (arch: MacArch) => string
): ArchAssets {
  return {
    arm64: asset(product, assets, tag, nameFor("arm64")),
    x64: asset(product, assets, tag, nameFor("x64"))
  }
}

export function parseRelease(value: unknown, product: Product = deskfleet): Release {
  const release = record(value)
  if (release.draft !== false || release.prerelease !== false) {
    throw new Error("Only published, non-prerelease releases may update the cask")
  }
  if (typeof release.tag_name !== "string" || !release.tag_name.startsWith("v")) {
    throw new Error("Expected a v-prefixed release tag")
  }
  const tag = release.tag_name
  const version = tag.slice(1)
  versionParts(version)
  if (!Array.isArray(release.assets)) throw new Error("Missing release assets")
  return {
    tag,
    version,
    desktop: archAssets(product, release.assets, tag, (arch) =>
      product.desktopAsset(version, arch)
    ),
    daemon: archAssets(product, release.assets, tag, (arch) => product.daemonAsset(arch))
  }
}

export interface PackageIdentity {
  version: string
  arm64: string
  x64: string
}

const dualSha256 = /^  sha256 arm:\s+"([a-f0-9]{64})",\n\s+intel:\s+"([a-f0-9]{64})"$/m

const formulaSha256 = (arch: MacArch) =>
  new RegExp(
    String.raw`^  on_${arch === "arm64" ? "arm" : "intel"} do\n(?:.*\n)*?    sha256 "([a-f0-9]{64})"`,
    "m"
  )

export function caskIdentity(content: string): PackageIdentity {
  const versions = [...content.matchAll(/^  version "([^"]+)"$/gm)]
  const checksums = content.match(dualSha256)
  if (versions.length !== 1 || !checksums) {
    throw new Error("Expected one pinned version and dual-architecture SHA-256 values in the cask")
  }
  const version = versions[0]![1]!
  versionParts(version)
  return { version, arm64: checksums[1]!, x64: checksums[2]! }
}

export function formulaIdentity(content: string): PackageIdentity {
  const versions = [...content.matchAll(/^  version "([^"]+)"$/gm)]
  const arm = content.match(formulaSha256("arm64"))
  const intel = content.match(formulaSha256("x64"))
  if (versions.length !== 1 || !arm || !intel) {
    throw new Error(
      "Expected one pinned version and dual-architecture SHA-256 values in the formula"
    )
  }
  const version = versions[0]![1]!
  versionParts(version)
  return { version, arm64: arm[1]!, x64: intel[1]! }
}

function assertUpgradeable(current: PackageIdentity, release: Release, packageKind: string): void {
  const comparison = compareVersions(release.version, current.version)
  if (comparison < 0) throw new Error(`Refusing to downgrade the ${packageKind}`)
  if (comparison === 0) {
    const expected = packageKind === "cask" ? release.desktop : release.daemon
    if (current.arm64 !== expected.arm64.sha256 || current.x64 !== expected.x64.sha256) {
      throw new Error(
        `Published bytes changed for the same version; manual investigation required (${packageKind})`
      )
    }
  }
}

export function updateCask(content: string, release: Release): string {
  const current = caskIdentity(content)
  assertUpgradeable(current, release, "cask")
  return content
    .replace(/^  version "[^"]+"$/m, `  version "${release.version}"`)
    .replace(
      dualSha256,
      `  sha256 arm:   "${release.desktop.arm64.sha256}",\n         intel: "${release.desktop.x64.sha256}"`
    )
}

export function updateFormula(content: string, release: Release): string {
  const current = formulaIdentity(content)
  assertUpgradeable(current, release, "formula")
  return content
    .replace(/^  version "[^"]+"$/m, `  version "${release.version}"`)
    .replace(formulaSha256("arm64"), (match) =>
      match.replace(/sha256 "[a-f0-9]{64}"/, `sha256 "${release.daemon.arm64.sha256}"`)
    )
    .replace(formulaSha256("x64"), (match) =>
      match.replace(/sha256 "[a-f0-9]{64}"/, `sha256 "${release.daemon.x64.sha256}"`)
    )
}
