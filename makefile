dc-nuclear:
	- docker stop $$(docker ps -a -q)
	- docker kill $$(docker ps -q)
	- docker rm $$(docker ps -a -q)
	- docker rmi $$(docker images -q)
	- docker system prune --all --force --volumes
	
dcup-dev:
	- docker-compose up

dcup-dev-backend:
	- docker-compose --profile backend up

dcup-dev-frontend:
	- docker-compose --profile frontend up

dcup-build:
	- docker-compose build

dcup-prod:
	- docker-compose -f ./docker-compose.prod.yml up

dcup-prod-build:
	- docker-compose -f ./docker-compose.prod.yml build

dc-down:
	- docker-compose down

dc-latex:
	- docker run -itd \
	  --hostname texlive \
	  --name texlive \
	  -v ${PWD}/datas:/root/data \
	  mrchoke/texlive

dc-latex-exec:
	@echo "No command specified for dc-latex-exec. Add your command here."