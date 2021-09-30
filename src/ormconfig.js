module.exports = {
    "type": "mysql",
    "host": "mysql",
    "port": 3306,
    "username": "AGuser",
    "password": "AGuser",
    "database": "AGRecordInfo",
    "synchronize": true,
    "logging": false,
    "entities": ["entities/**/*.ts"],
    "migrations": ["models/migrations/**/*.ts"],
    "subscribers": ["models/subscribers/**/*.ts"],
    "cli": {
       "entitiesDir": "entities",
       "migrationsDir": "models/migrations",
       "subscribersDir": "models/subscribers"
    }
 }