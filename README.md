- Concert Manager – API REST & Frontend

Projet de gestion de groupes de musique, salles et concerts basé sur :

Backend : Symfony 6.4 LTS – API REST

Frontend : Angular 18+

Base de données : MySQL 8

Infrastructure : Docker & Docker Compose

* Architecture du projet
.
├── Backend/        # API REST Symfony
└── Frontend/       # Application Angular

-Backend – API REST Symfony 6.4 LTS

*Prérequis

Docker

Docker Compose

- Configuration de la base de données

Dans le fichier .env :

DATABASE_URL="mysql://user:password@127.0.0.1:3306/concert_manager?serverVersion=8.0&charset=utf8mb4"

- Installation
cd Backend

# 1. Construire et démarrer les conteneurs
sudo docker-compose up -d --build

# 2. Installer les dépendances PHP
sudo docker-compose exec api composer install

# 3. Créer la base de données
sudo docker-compose exec api php bin/console doctrine:database:create

# 4. Créer les tables (ou utiliser les migrations)
sudo docker-compose exec api php bin/console doctrine:schema:update --force


- Accès aux services

API Symfony : http://localhost:8005

PHPMyAdmin : http://localhost:8080

-User : root
-Password : root

- Migrations (option recommandée)
sudo docker-compose exec api php bin/console doctrine:migrations:migrate

*Frontend – Angular
- Prérequis

Node.js 18+

npm

Angular CLI 18+

Docker & Docker Compose (optionnel)

- Installation avec Docker
cd Frontend

# Construire l'image Docker
sudo docker-compose build

# Lancer le conteneur
sudo docker-compose up -d


 Application Angular disponible sur : http://localhost:4202

* Endpoints API
- Groups
Méthode	Endpoint	Description
GET	/api/groups	Liste des groupes (filtres : name, city, musicalStyle, startYear)
POST	/api/groups	Créer un groupe
GET	/api/groups/{id}	Détails d’un groupe
PUT	/api/groups/{id}	Modifier un groupe
DELETE	/api/groups/{id}	Supprimer un groupe


- Salles
Méthode	Endpoint	Description
GET	/api/salles	Liste des salles (filtres : city, minCapacity)
POST	/api/salles	Créer une salle
GET	/api/salles/{id}	Détails d’une salle
PUT	/api/salles/{id}	Modifier une salle
DELETE	/api/salles/{id}	Supprimer une salle
- Concerts
Méthode	Endpoint	Description
GET	/api/concerts	Liste des concerts (filtres : status, date, salleId, groupId)
POST	/api/concerts	Créer un concert
GET	/api/concerts/{id}	Détails d’un concert
PUT	/api/concerts/{id}	Modifier un concert
DELETE	/api/concerts/{id}	Supprimer un concert


-Exemples

-Créer un groupe

POST http://localhost:8005/api/groups

{
  "name": "Metallica",
  "origin": "USA",
  "city": "Los Angeles",
  "startYear": 1981,
  "endYear": null,
  "founders": "James Hetfield, Lars Ulrich",
  "membersCount": 4,
  "musicalStyle": "Metal",
  "presentation": "Legendary metal band"
}

-Créer une salle

POST http://localhost:8005/api/salles

{
  "name": "Zénith Paris",
  "city": "Paris",
  "capacity": 6000,
  "address": "211 Avenue Jean Jaurès"
}

-Créer un concert

POST http://localhost:8005/api/concerts

{
  "groupId": 5,
  "salleId": 1,
  "date": "2026-07-20",
  "time": "20:00",
  "duration": 2,
  "status": "planned"
}
