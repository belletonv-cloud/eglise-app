#!/usr/bin/env bash
# Interactive helper to set GitHub repository secrets using gh
# Usage: chmod +x scripts/set-github-secrets.sh && ./scripts/set-github-secrets.sh

set -euo pipefail

repo=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  url=$(git remote get-url origin 2>/dev/null || true)
  if [[ -n "$url" ]]; then
    # normalize to owner/repo
    repo_candidate=${url##*:}
    repo_candidate=${repo_candidate##*/}
    # if URL is https://github.com/owner/repo.git handle that
    if [[ "$url" =~ github.com[:/](.+/.+)(\.git)?$ ]]; then
      repo="${BASH_REMATCH[1]}"
    fi
  fi
fi

echo "GitHub Secrets setter"
echo
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI not found. Install and authenticate: https://cli.github.com/"
  exit 1
fi

if [[ -z "$repo" ]]; then
  read -r -p "Enter GitHub repo (owner/repo) to set secrets (example: belletonv-cloud/eglise-app): " repo
else
  read -r -p "Detected repo '$repo'. Use this repo? [Y/n] " use
  case "$use" in
    [Nn]*) read -r -p "Enter GitHub repo (owner/repo): " repo ;;
  esac
fi

echo
echo "You will be prompted for each secret. For sensitive values, input will be hidden."
echo "Press ENTER to skip a secret."
echo

set_secret() {
  local name=$1
  local hidden=${2:-true}
  local val
  if [[ "$hidden" == "true" ]]; then
    read -s -r -p "$name: " val || true
    echo
  else
    read -r -p "$name: " val || true
  fi
  if [[ -z "$val" ]]; then
    echo "Skipping $name"
    return
  fi
  printf '%s' "$val" | gh secret set "$name" --repo "$repo"
  echo "$name set"
  # unset the variable to avoid lingering in environment
  unset val
}

echo "-- Runtime secrets --"
set_secret PCO_TOKEN_ID true
set_secret PCO_TOKEN_SECRET true
set_secret RESEND_API_KEY true
set_secret INFOMANIAK_TOKEN true
set_secret FCM_SERVER_KEY true
set_secret ONECLICK_SECRET true
set_secret EMAIL_FROM false

echo
echo "-- Deployment / sync credentials --"
set_secret GCP_PROJECT_ID false
set_secret CF_API_TOKEN true

echo
echo "GCP Service Account JSON (recommended to provide via file)."
read -r -p "Enter path to service account JSON file (leave empty to paste JSON): " sa_path
if [[ -n "$sa_path" && -f "$sa_path" ]]; then
  printf '%s' "$(cat "$sa_path")" | gh secret set GCP_SA_KEY --repo "$repo"
  echo "GCP_SA_KEY set from file $sa_path"
else
  read -s -r -p "Paste the GCP service account JSON now (hidden): " sa_json || true
  echo
  if [[ -n "$sa_json" ]]; then
    printf '%s' "$sa_json" | gh secret set GCP_SA_KEY --repo "$repo"
    echo "GCP_SA_KEY set"
    unset sa_json
  else
    echo "Skipping GCP_SA_KEY"
  fi
fi

echo
echo "Done. You can verify secrets with: gh secret list --repo $repo"
echo "Then trigger the 'Sync Secrets' workflow in Actions to propagate to Cloudflare/GCP."

exit 0
