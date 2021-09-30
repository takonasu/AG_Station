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
    "cli": {
       "entitiesDir": "entities",
    }
 }
 