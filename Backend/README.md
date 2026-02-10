# API REST Symfony - Gestion de Concerts

Symfony 6.4 LTS - API REST


2. Configurer la base de données dans `.env` :
```env
DATABASE_URL="mysql://user:password@127.0.0.1:3306/concert_manager?serverVersion=8.0&charset=utf8mb4"

## Installation


cd Backend

# 1. Construire et démarrer
sudo docker-compose up -d --build

# 2. Installer les dépendances
sudo docker-compose exec api composer install

# 3. Créer la base de données
sudo docker-compose exec api php bin/console doctrine:database:create

# 4. Créer les tables
sudo docker-compose exec api php bin/console doctrine:schema:update --force


Symfony : http://localhost:8005
PHPMyAdmin : http://localhost:8080 (user: root, password: root)
```


```

3. Créer la base de données et exécuter les migrations :
```bash
sudo docker-compose exec api php bin/console doctrine:database:create
sudo docker-compose exec api php bin/console doctrine:migrations:migrate
```

## Endpoints API

### Groups

- `GET    /api/groups` - Liste tous les groupes (filtres: name, city, musicalStyle, startYear)
- `POST   /api/groups` - Crée un nouveau groupe
- `GET    /api/groups/{id}` - Affiche un groupe
- `PUT    /api/groups/{id}` - Met à jour un groupe
- `DELETE /api/groups/{id}` - Supprime un groupe

### Salles

- `GET    /api/salles` - Liste toutes les salles (filtres: city, minCapacity)
- `POST   /api/salles` - Crée une nouvelle salle
- `GET    /api/salles/{id}` - Affiche une salle
- `PUT    /api/salles/{id}` - Met à jour une salle
- `DELETE /api/salles/{id}` - Supprime une salle

### Concerts

- `GET    /api/concerts` - Liste tous les concerts (filtres: status, date, salleId, groupId)
- `POST   /api/concerts` - Crée un nouveau concert
- `GET    /api/concerts/{id}` - Affiche un concert
- `PUT    /api/concerts/{id}` - Met à jour un concert
- `DELETE /api/concerts/{id}` - Supprime un concert





## Exemples de payloads

### POST http://localhost:8005/api/groups
```json
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
```

### http://localhost:8005/POST /api/salles
```json
{
  "name": "Zénith Paris",
  "city": "Paris",
  "capacity": 6000,
  "address": "211 Avenue Jean Jaurès"
}
```

### POST http://localhost:8005/api/concerts
```json
{
  "groupId": 5,
  "salleId": 1,
  "date": "2026-07-20",
  "time": "20:00",
  "duration": 2,
  "status": "planned"
}
```

## Statuts de concert

- `planned` : Planifié
- `done` : Terminé
- `cancelled` : Annulé

