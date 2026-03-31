.PHONY: start fetch

start:
	cd web && PORT=80 npm run dev

fetch:
	cd fetcher && npm start
