# Branch strategy and protection

- Use `main` for reviewed, releasable work. Do not push directly.
- Create short-lived branches: `feature/<summary>`, `fix/<summary>`, or
  `docs/<summary>`.
- Open a pull request into `main`; describe user impact, tests, and any
  environment/configuration changes.
- Require at least one approving review and dismiss stale approvals after new
  commits.
- Require the GitHub Actions `validate` status check and require branches to be
  up to date before merge.
- Require conversation resolution; disallow force pushes and deletion of
  `main`. Apply the same rules to administrators where practical.
- Keep secrets out of pull requests. Use GitHub's secret store only for
  explicitly approved future automation. No deployment workflow is configured
  in Phase 1.
