# Mabble
informatic services platform with crypto currencies payments

# Architecture

Frontend ReactJS with Vite - **localhost:5173**

Backend NestJS - **localhost:4000**

Backend payments microservice - **localhost:4001**

Database PostgreSQL - **localhost:4002**

Everything is managed with Docker, which can be started using the Makefile: : **Make up**

**Hot reload is enabled**, so containers do not need to be restarted when coding.

⚠️ TODO update the Makefile soon. I currently have a cursed Docker setup that forces the docker-compose format instead of docker compose, shell detection command does not work. ⚠️

# Database - PostgreSQL | localhost:4002 (Le N)

The database is created during initialization using the .env file.

init.sql is used to create tables and optionally seed them with initial data.

# Backend API | localhost:4000 (Le N)

This is the main entry point between the client and the data.

The API is responsible for:
   - parsing incoming requests
   - validating request consistency
   - communicating with services and the database
   - returning the appropriate data to the client when needed

# Frontend - ReactJS | localhost:5173 (Le A)

This contains all the visual interface and sends requests to the backend to display data.

The frontend follows the SPA (Single Page Application) architecture, meaning:

- a single HTML page is loaded
- the content updates dynamically depending on navigation or user actions (for example when clicking somewhere or when logged into an account)

# Payments Backend Microservices | localhost:4001 (Le J)

Backend service responsible for cryptocurrency payment processing.

This service:
  - communicates with the main backend API
  - never interacts directly with clients


