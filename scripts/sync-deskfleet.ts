import { appendFile, readFile, rename, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  deskfleet,
  latestReleaseApiUrl,
  parseRelease,
  updateCask,
  updateFormula
} from "./release-policy.ts"
import type { Release } from "./release-policy.ts"

const caskPath = fileURLToPath(new URL("../Casks/deskfleet.rb", import.meta.url))
const formulaPath = fileURLToPath(new URL("../Formula/deskfleet-daemon.rb", import.meta.url))
const publicFetch = (url: string) => fetch(url, { signal: AbortSignal.timeout(300_000) })

async function latest(): Promise<Release> {
  const response = await publicFetch(latestReleaseApiUrl(deskfleet))
  if (!response.ok) throw new Error(`Release lookup failed: HTTP ${response.status}`)
  return parseRelease(await response.json(), deskfleet)
}

async function writeIfChanged(path: string, next: string, current: string): Promise<boolean> {
  if (next === current) return false
  const temporaryPath = `${path}.sync-${process.pid}`
  try {
    await writeFile(temporaryPath, next, { flag: "wx" })
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
  return true
}

async function synchronize(): Promise<{ changed: boolean; version: string }> {
  const [caskContent, formulaContent] = await Promise.all([
    readFile(caskPath, "utf8"),
    readFile(formulaPath, "utf8")
  ])
  const release = await latest()
  const nextCask = updateCask(caskContent, release)
  const nextFormula = updateFormula(formulaContent, release)
  const confirmed = await latest()
  if (JSON.stringify(confirmed) !== JSON.stringify(release)) {
    throw new Error("Latest release changed during verification; retry synchronization")
  }
  const caskChanged = await writeIfChanged(caskPath, nextCask, caskContent)
  const formulaChanged = await writeIfChanged(formulaPath, nextFormula, formulaContent)
  return { changed: caskChanged || formulaChanged, version: release.version }
}

if (import.meta.main) {
  try {
    if (process.argv.length > 2) {
      throw new Error("Usage: node scripts/sync-deskfleet.ts")
    }
    const result = await synchronize()
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `changed=${result.changed}\nversion=${result.version}\n`
      )
    }
    console.log(
      `DeskFleet ${result.version}: ${result.changed ? "updated packaging" : "already synchronized"}`
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Packaging synchronization failed")
    process.exitCode = 1
  }
}
