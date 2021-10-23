install:
	docker-compose up -d && docker-compose exec backendapp bash -c 'npm install' && docker-compose exec frontendapp bash -c 'npm install && npm run build' && docker-compose down

run:
	docker-compose up -d && docker-compose exec -d backendapp bash -c 'npm run ts-node index.ts' && docker-compose exec -d frontendapp bash -c 'npm run start'

down:
	docker-compose down