#Pour gerer le docker-compose ou le docker compose
DC := $(shell command -v docker-compose >/dev/null 2>&1 && echo docker-compose || echo docker compose)

up:
	$(DC) up -d
	make logs

down:
	$(DC) down

#Nettoyage complet des volumes et images. A FAIRE TOUJOURS APRES DES AJOUTS DE DEPENDANCES
clean:
	$(DC) down -v --rmi all --remove-orphans

up-api:
	@echo "Lancement de l'api"
	$(DC) up -d api

up-payments:
	@echo "Lancement des payments"
	$(DC) up -d payments

up-frontend:
	@echo "Lancement du frontend"
	$(DC) up -d frontend

up-db:
	@echo "Lancement de la db"
	$(DC) up -d db

logs:
	@echo "Logs de tout les containers"
	$(DC) logs -f

logs-api:
	@echo "Logs de l'api"
	$(DC) logs -f api

logs-payments:
	@echo "Logs de payments"
	$(DC) logs -f payments

logs-frontend:
	@echo "Logs du frontend"
	$(DC) logs -f frontend

logs-db:
	@echo "Logs de la db"
	$(DC) logs -f db

list-adm:
	docker exec -it mabble-api-1 npx ts-node src/admission.ts listPending


list-all:
	docker exec -it mabble-api-1 npx ts-node src/admission.ts listAll

#make accept-adm USER_ID=UUID
accept-adm:
	docker exec -it mabble-api-1 npx ts-node src/admission.ts accept $(USER_ID)

#make reject-adm USER_ID=UUID
reject-adm:
	docker exec -it mabble-api-1 npx ts-node src/admission.ts reject $(USER_ID)

