---
applyTo: "**/*.yml,**/*.yaml"
---

# GitHub Actions Workflow File Standards

## Required Header Block

Every workflow file must start with a structured comment header immediately after `name:`:

```yaml
# ============================================================
# Purpose: [Brief description of what this workflow does]
# Triggers: [When this workflow runs]
# Permissions: [What permissions this workflow needs]
# ============================================================
```

## Example

```yaml
name: CI Pipeline

# ============================================================
# Purpose: Run linting, tests, and security checks on push/PR
# Triggers: push to main, pull requests
# Permissions: contents:read, pull-requests:write
# ============================================================

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

## Best Practices

1. **Always include the header block** - It provides quick context for workflow purpose and configuration
2. **Keep descriptions concise** - Use brief, clear language in the Purpose field
3. **List all triggers** - Document all events that trigger the workflow
4. **Document permissions** - Clearly state what permissions the workflow requires
5. **Use consistent formatting** - Follow the exact format shown in the template
