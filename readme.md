# Habit Tracer Server


# Api RESTful Habit Helper

The Habit API is a powerful Node.js-based solution designed to assist users in managing their habits effectively. This API provides comprehensive functionality for tracking, monitoring, and analyzing habits, offering a robust set of endpoints to create, update, and retrieve habit-related data.  Built with performance and scalability in mind, the Habit API ensures fast and reliable access to habit data, empowering users to make informed decisions and achieve their goals. It serves as a reliable backend.


#### DataBase
  - PostgreSQL(Neon Serverless), 

### Technologies
  - NodeJS
  - Typescript
  - Fastify
  - Prisma ORM
 
#### CyberSecurity
  - DotEnv
  - JWT
  - BCrypt
  - Fastify Data Validation Schemas
  - Zod Data Validation
  
## Dependencies
```bash
npm install
```
```bash
 "dependencies": {
    "@fastify/cors": "^8.2.1",
    "@fastify/env": "^4.2.0",
    "@fastify/jwt": "^6.7.1",
    "@fastify/swagger": "^8.3.1",
    "@fastify/swagger-ui": "^1.8.0",
    "@prisma/client": "^4.15.0",
    "dayjs": "^1.11.7",
    "fastify": "^4.15.0",    
    "zod": "^3.21.4"
  },
  "devDependencies": {    
    "@types/events": "^3.0.0",
    "@types/node": "^18.16.16",
    "typescript": "^5.0.4",
    "prisma": "^4.15.0",
    "tsx": "^3.12.6"
  },
```
    
#### Testing
  - Postman

## Documentation

[Documentation](https://documenter.getpostman.com/view/22862786/2s93zCXztX)

## Run Locally

Clone the project

```bash
  git clone https://github.com/diegojfcampos/api_habit_helper.git
```

Go to the project directory

```bash
  cd api_habit_helper
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```
## Authors

- [@diegojfcampos](https://www.github.com/diegojfcampos)
