import assert from "node:assert/strict"
import { test } from "node:test"
import {
  actionsPullRequestPermissionError,
  actionsPullRequestPermissionRemediation,
  explainActionsPullRequestPermissionFailure,
  isActionsPullRequestPermissionError
} from "./actions-pr-permission.ts"

test("recognizes the Actions pull request permission API error", () => {
  const message = `${actionsPullRequestPermissionError}. - https://docs.github.com/rest/pulls/pulls#create-a-pull-request`
  assert.equal(isActionsPullRequestPermissionError(message), true)
  assert.equal(
    explainActionsPullRequestPermissionFailure(message),
    actionsPullRequestPermissionRemediation
  )
  assert.match(
    actionsPullRequestPermissionRemediation,
    /Allow GitHub Actions to create and approve pull requests/
  )
  assert.match(actionsPullRequestPermissionRemediation, /GITHUB_TOKEN/)
  assert.match(actionsPullRequestPermissionRemediation, /Do not add a Tap sync PAT, GitHub App/)
  assert.match(actionsPullRequestPermissionRemediation, /does not auto-merge/)
})

test("ignores unrelated pull request failures", () => {
  for (const message of [
    "Validation Failed: A pull request already exists",
    "Resource not accessible by integration",
    "Not Found"
  ]) {
    assert.equal(isActionsPullRequestPermissionError(message), false)
    assert.equal(explainActionsPullRequestPermissionFailure(message), null)
  }
})
