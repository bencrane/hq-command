#!/usr/bin/env sh
set -eu

# The DOPPLER_TOKEN service token is scoped to a single Doppler config
# (dev / stg / prd), so project and config are inferred — no APP_ENV needed.
# APP_ENV itself is stored *inside* each Doppler config and injected by
# `doppler run` for the app to read.
exec doppler run -- node server.js
