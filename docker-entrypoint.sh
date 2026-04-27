#!/usr/bin/env sh
set -eu

case "${APP_ENV:-prd}" in
    dev) DOPPLER_CONFIG="dev" ;;
    stg) DOPPLER_CONFIG="stg" ;;
    prd) DOPPLER_CONFIG="prd" ;;
    *)
        echo "Unknown APP_ENV: ${APP_ENV}" >&2
        exit 1
        ;;
esac

exec doppler run --project hq-command --config "$DOPPLER_CONFIG" -- \
    node server.js
