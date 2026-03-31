.PHONY: start fetch

start:
	cd web && PORT=80 npm run dev -- --hostname 0.0.0.0

fetch:
	cd fetcher && npm start
