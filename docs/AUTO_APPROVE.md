# Auto-Approve Workflow Documentation

## Overview

The System AI Optimizer repository includes an automated pull request approval workflow that streamlines the review and merge process for trusted automated contributions, particularly from Dependabot and GitHub Actions.

## Features

### Automatic Approval
- **Scope**: Automatically approves pull requests from:
  - `dependabot[bot]` - Dependency update PRs
  - `github-actions[bot]` - Automated workflow PRs

### Safety Checks
- **CI Validation**: Waits for all CI checks to pass before approval
- **Check Name**: Monitors the 'test' job from the CI/CD pipeline
- **Wait Interval**: Checks every 30 seconds for CI completion
- **Allowed Conclusions**: Only approves if CI result is 'success'

### Auto-Merge
- **Automatic Merging**: Enables auto-merge after successful approval
- **Merge Strategy**: Uses standard merge commits
- **Dependencies**: Requires the approval job to complete successfully

## Workflow Triggers

The workflow runs on the following pull request events:
- `opened` - When a new PR is created
- `synchronize` - When new commits are pushed to an existing PR
- `reopened` - When a closed PR is reopened

## Permissions

The workflow requires specific permissions:
- `pull-requests: write` - To approve and merge pull requests
- `contents: write` - To merge changes into the repository

## Configuration

### Workflow File
Location: `.github/workflows/auto-approve.yml`

### Key Components

#### 1. Wait for CI Checks
```yaml
- name: Wait for CI checks
  uses: lewagon/wait-on-check-action@v1.3.1
  with:
    ref: ${{ github.event.pull_request.head.sha }}
    check-name: 'test'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    wait-interval: 30
    allowed-conclusions: success
```

#### 2. Auto Approve
```yaml
- name: Auto approve Dependabot PRs
  uses: hmarr/auto-approve-action@v3
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    review-message: 'Auto-approved by GitHub Actions after successful CI checks'
```

#### 3. Auto Merge
```yaml
- name: Enable auto-merge for Dependabot PRs
  run: gh pr merge --auto --merge "$PR_URL"
  env:
    PR_URL: ${{ github.event.pull_request.html_url }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Security Considerations

### pull_request_target vs pull_request
The workflow uses `pull_request_target` instead of `pull_request` for security reasons:
- Runs in the context of the base repository
- Has access to repository secrets
- Prevents malicious code execution from fork PRs
- Suitable for approval workflows

### Actor Filtering
Only specific actors are allowed:
- `dependabot[bot]` - Official GitHub Dependabot
- `github-actions[bot]` - Official GitHub Actions bot

This prevents unauthorized automated approvals.

## Manual Override

Repository administrators can:
- Disable the workflow by deleting or renaming the workflow file
- Override approvals by manually reviewing PRs
- Adjust the actor filter to include/exclude specific bots
- Modify CI check requirements

## Troubleshooting

### Workflow Not Running
- Verify the workflow file is in `.github/workflows/`
- Check that the PR is from an allowed actor
- Ensure the repository has Actions enabled

### Auto-Approve Failing
- Check if CI checks are passing
- Verify the 'test' job exists in CI workflow
- Review workflow logs for specific errors

### Auto-Merge Not Working
- Ensure branch protection rules allow auto-merge
- Verify required reviews are satisfied
- Check that CI checks are passing

## Maintenance

### Updating the Workflow
When modifying the workflow:
1. Test changes in a feature branch
2. Verify YAML syntax
3. Test with a sample Dependabot PR
4. Monitor initial runs after deployment

### Version Updates
Periodically update action versions:
- `lewagon/wait-on-check-action`
- `hmarr/auto-approve-action`

Check for security advisories and new features in action repositories.

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Auto-merge Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)

## Support

For issues or questions:
1. Check workflow run logs in Actions tab
2. Review this documentation
3. Open an issue in the repository
4. Contact repository maintainers
