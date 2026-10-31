#!/bin/sh
# Imports the workflows from n8n/workflows and publishes them. Safe to re-run.
set -eu

docker compose exec -T n8n n8n import:workflow --separate --input=/workflows
for id in LendLoopErrors01 LendLoopRequest1 LendLoopOverdue1; do
  docker compose exec -T n8n n8n publish:workflow --id="$id"
done
docker compose restart n8n
