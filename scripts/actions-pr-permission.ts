/** Detect the Actions setting that blocks GITHUB_TOKEN pull request creation. */

export const actionsPullRequestPermissionError =
  "GitHub Actions is not permitted to create or approve pull requests"

export const actionsPullRequestPermissionRemediation = [
  "DeskFleet sync can push the fixed branch with GITHUB_TOKEN, but cannot open or",
  "update the review PR until this repository (or org) setting is enabled:",
  "",
  "  Settings → Actions → General → Workflow permissions",
  '  → enable "Allow GitHub Actions to create and approve pull requests"',
  "",
  "Keep using the default GITHUB_TOKEN only. Do not add a Tap sync PAT, GitHub App,",
  "or DeskFleet-side notify job for this path. Sync still stops for manual review;",
  "it does not auto-merge."
].join("\n")

export function isActionsPullRequestPermissionError(message: string): boolean {
  return message.includes(actionsPullRequestPermissionError)
}

export function explainActionsPullRequestPermissionFailure(message: string): string | null {
  if (!isActionsPullRequestPermissionError(message)) return null
  return actionsPullRequestPermissionRemediation
}

if (import.meta.main) {
  const input = process.argv.slice(2).join(" ").trim() || actionsPullRequestPermissionError
  const explanation = explainActionsPullRequestPermissionFailure(input)
  if (!explanation) {
    console.error("Unrecognized pull request creation failure")
    process.exitCode = 1
  } else {
    console.error(explanation)
  }
}
