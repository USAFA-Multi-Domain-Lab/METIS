# Installing Existing Target Environments

Use the METIS CLI to install target environments that already exist in GitHub repositories. This guide covers standard installs for publicly accessible repositories, token-based installs for private repositories, and the follow-up steps required after the files are downloaded.

## Table of Contents

- [When to Use This Guide](#when-to-use-this-guide)
- [Install a Public Target Environment](#install-a-public-target-environment)
  - [Recognized Authors](#recognized-authors)
  - [Custom Repository Owners](#custom-repository-owners)
- [Install a Private Target Environment](#install-a-private-target-environment)
  - [Create a GitHub Token](#create-a-github-token)
  - [Recommended Scope](#recommended-scope)
  - [Install Commands](#install-commands)
- [After Installation](#after-installation)
- [Security Notes](#security-notes)
- [Related Documentation](#related-documentation)

## When to Use This Guide

Use this guide when you want to install a target environment that has already been created and published in a GitHub repository. This is the correct path for pulling down pre-existing target environments with the METIS CLI instead of building one from scratch.

If you are creating a new target environment yourself, start with the [Creating Target Environments](creating-target-environments.md) guide instead.

## Install a Public Target Environment

If the repository is publicly accessible, you can install it without a GitHub token.

### Recognized Authors

If the repository owner is already one of the METIS-recognized authors, install the target environment with:

```bash
metis install <target-env-id>
```

### Custom Repository Owners

If the repository owner is not in the CLI's recognized author list, specify the owner explicitly:

```bash
metis install <target-env-id> --author <github-owner>
```

## Install a Private Target Environment

If the repository is private, use a GitHub personal access token (classic) so the METIS CLI can authenticate to GitHub, fetch release information, and download the target environment archive.

### Create a GitHub Token

Create a personal access token (classic) in GitHub before running the install command:

1. Sign in to GitHub.
2. Open `Settings`.
3. Go to `Developer settings`.
4. Select `Personal access tokens` and then `Tokens (classic)`.
5. Choose `Generate new token (classic)`.
6. Give the token a descriptive name and set an expiration that matches your organization's policy.
7. Grant the token the required repository access.
8. **Copy the token and store it somewhere secure before leaving the page.**

### Recommended Scope

For a classic token, enable the `repo` scope so GitHub will allow access to private repositories and their release assets.

> **Note:** If your GitHub organization has additional token restrictions, follow your organization's policy and grant only the minimum access required for the target environment repository.

### Install Commands

If the private repository belongs to a METIS-recognized author, install it with:

```bash
metis install <target-env-id> --token <your-token-here>
```

Example:

```bash
metis install metis-test-env --token <your-token-here>
```

If the private repository belongs to a custom owner, include both the owner and the token:

```bash
metis install <target-env-id> --author <github-owner> --token <your-token-here>
```

## After Installation

After the CLI finishes downloading the target environment, METIS will discover it from the `/integration/target-env/` directory.

If the METIS server is already running when the install completes, restart it so the new target environment is discovered and loaded.

Many target environments also require a `configs.json` file after installation. Check the target environment's README or other target-environment documentation, the [configs.json Reference](../references/configs-json.md), and/or the [Environment Configuration](../references/environment-configuration.md) reference for the expected connection settings.

## Security Recommendations

- Treat the token like a password.
- Do not commit the token to source control or paste it into shared documentation.
- Be aware that passing a token on the command line may leave it in your shell history.
- Prefer short-lived tokens and rotate them according to your organization's policy.

## Related Documentation

- [Target Environment Integration](../index.md) - Main hub for target environment guides and references.
- [Creating Target Environments](creating-target-environments.md) - Build a new target environment instead of installing an existing one.
- [configs.json Reference](../references/configs-json.md) - Configure the installed target environment after installation.
- [Setup & Installation](../../setup/index.md) - Core METIS installation and deployment guidance.
