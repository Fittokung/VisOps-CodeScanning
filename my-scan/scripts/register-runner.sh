#!/bin/bash
# register-runner.sh

# Default values
DEFAULT_URL="http://[IP_ADDRESS]"
CONFIG_VOL="./gitlab-runner-config"

echo "=== GitLab Runner Registration ==="
echo "You need a Registration Token from your GitLab Project:"
echo "Go to Settings > CI/CD > Runners > New Project Runner"
echo "-----------------------------------------------------"

read -p "Enter GitLab URL (default: $DEFAULT_URL): " INPUT_URL
GITLAB_URL="${INPUT_URL:-$DEFAULT_URL}"

read -p "Enter Registration Token: " REGISTRATION_TOKEN

if [ -z "$REGISTRATION_TOKEN" ]; then
  echo "Error: Token is required."
  exit 1
fi

echo "Registering Runner with:"
echo "  URL: $GITLAB_URL"
echo "  Token: $REGISTRATION_TOKEN"

# Create config dir if not exists
mkdir -p "$CONFIG_VOL"

# Run registration command
docker run --rm -v "${PWD}/gitlab-runner-config:/etc/gitlab-runner" gitlab/gitlab-runner register \
  --non-interactive \
  --url "$GITLAB_URL" \
  --token "$REGISTRATION_TOKEN" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --description "VisOps-Runner" \
  --maintenance-note "Auto-configured by script" \
  --tag-list "docker,linux" \
  --run-untagged="true" \
  --locked="false" \
  --access-level="not_protected"

echo "-----------------------------------------------------"
echo " Registration Complete!"
echo "Now start the runner with: docker-compose -f docker-compose.runner.yml up -d"
