.PHONY: install dev build lint format test docker-build

install:
	pnpm install

dev:
	doppler run -- pnpm dev --port 3000

build:
	doppler run -- pnpm build

lint:
	pnpm lint

format:
	pnpm prettier --write .

test:
	pnpm test

docker-build:
	docker build --build-arg DOPPLER_TOKEN=$$DOPPLER_TOKEN -t hq:local .
