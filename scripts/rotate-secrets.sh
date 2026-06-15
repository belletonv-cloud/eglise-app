#!/usr/bin/env bash
# Rotate secrets helper script
# Usage: chmod +x scripts/rotate-secrets.sh && ./scripts/rotate-secrets.sh
#
# This script prompts for new secret values and updates them in:
# - Cloudflare Workers via `wrangler secret put` (if wrangler is installed)
# - GitHub repository secrets via `gh secret set` (if gh is installed)
#
# The script does NOT store secrets in the repository.

set -euo pipefail

repo_from_remote() {
  url=$(git remote get-url origin 2>/dev/null || true)
  if [[ -z "$url" ]]; then
    echo ""
    return
  fi
  if [[ "$url" =~ github.com[:/](.+/.+)(\.git)?$ ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo ""
  fi
}

put_wrangler_secret() {
  local name=$1
  local val=$2
  if command -v wrangler >/dev/null 2>&1; then
    printf '%s' "$val" | wrangler secret put "$name"
    echo "[wrangler] set $name"
  else
    echo "wrangler not found — run manually to set $name:"
    echo "  echo -n '***REDACTED***' | wrangler secret put $name"
  fi
}

put_github_secret() {
  local name=$1
  local val=$2
  local repo=$3
  if [[ -z "$repo" ]]; then
    echo "No GitHub repo provided; skipping GH secret for $name"
    return
  fi
  if command -v gh >/dev/null 2>&1; then
    printf '%s' "$val" | gh secret set "$name" --repo "$repo"
    echo "[gh] set $name for $repo"
  else
    echo "gh CLI not found — run manually to set $name on GitHub:"
    echo "  echo -n '***REDACTED***' | gh secret set $name --repo $repo"
  fi
}

prompt_secret() {
  local prompt=$1
  local allow_empty=${2:-false}
  local val
  while true; do
    read -r -s -p "$prompt: " val || true
    echo
    if [[ -z "$val" && "$allow_empty" != "true" ]]; then
      echo "Value cannot be empty. Enter a value or Ctrl+C to cancel."
      continue
    fi
    # Confirm
    read -r -s -p "Confirm value (retype): " val2 || true
    echo
    if [[ "$val" != "$val2" ]]; then
      echo "Values do not match — try again."
      continue
    fi
    printf '%s' "$val"
    return
  done
}

echo "Rotate secrets helper"
echo "This will help you set secrets in Cloudflare (wrangler) and GitHub (gh)."
echo

detected_repo=$(repo_from_remote)
if [[ -n "$detected_repo" ]]; then
  echo "Detected GitHub repo: $detected_repo"
else
  read -r -p "Enter GitHub repo (owner/repo) to set GH secrets, or leave empty to skip GH: " detected_repo
fi

echo
echo "For each secret, enter the new value when prompted. Leave empty to skip."
echo

declare -a secrets=(
  "PCO_TOKEN_ID"
  "PCO_TOKEN_SECRET"
  "RESEND_API_KEY"
  "INFOMANIAK_TOKEN"
  "FCM_SERVICE_ACCOUNT"
  "ONECLICK_SECRET"
  "EMAIL_FROM"
)

for name in "${secrets[@]}"; do
  read -r -p "Do you want to update $name? [y/N] " yn || true
  case "$yn" in
    [Yy]* )
      val=$(prompt_secret "Enter new value for $name" true)
      if [[ -n "$val" ]]; then
        put_wrangler_secret "$name" "$val"
        put_github_secret "$name" "$val" "$detected_repo"
      else
        echo "Skipping $name (empty)"
      fi
      ;;
    * )
      echo "Skipping $name" ;;
  esac
  echo
done

echo "All done. Reminders:"
echo "- Rotate tokens in provider dashboards as needed (e.g., Planning Center, Resend, Infomaniak)."
echo "- After updating secrets, redeploy your Workers / Pages / Apps if needed."
echo "- Ask collaborators to reclone the repository: git clone https://github.com/${detected_repo}.git"

exit 0
