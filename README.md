# Train Booking Backend

RESTful API Backend for a Train Booking System, built with Node.js and Express. The service provides the backend foundation for train reservation workflows, including API routing, database connectivity, authentication-related configuration, and API documentation.

The project is organized into modules and shared components to support maintainability, separation of concerns, and easier deployment with Docker.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Health Checks](#health-checks)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## Overview

Train Booking Backend is a RESTful API service designed to support a train booking application.

The backend acts as the intermediary between clients and the underlying data services. It receives HTTP requests, processes application logic, interacts with the database, and returns structured responses.

The project includes:

- An Express-based HTTP server.
- A modular source-code structure.
- MongoDB connectivity through Mongoose.
- Environment-based configuration.
- API documentation through Swagger/OpenAPI.
- Health-check endpoints for service monitoring.
- Docker support for containerized deployment.

> Note: The exact business capabilities and API endpoints should be verified against the current implementation and API specification.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime for the backend |
| Express.js | HTTP server and API routing |
| MongoDB | Document-oriented database |
| Mongoose | MongoDB object modeling |
| JWT | Token-based authentication support |
| Redis / ioredis | Redis integration, where used by the application |
| Swagger / OpenAPI | API documentation |
| Docker | Application containerization |
| Docker Compose | Container lifecycle and runtime configuration |
| ESLint | Code quality and linting |

---

## System Architecture

The application is organized into separate modules and shared components.

### Main Components

- **Server Layer**: Starts the HTTP server and establishes the database connection.
- **Application Layer**: Configures Express, middleware, API routes, health checks, and documentation.
- **Modules**: Organize business-related functionality into separate areas.
- **Configuration**: Contains configuration for database connections and other infrastructure.
- **Shared Components**: Provide reusable utilities and common functionality across modules.
- **Database Layer**: Uses MongoDB through Mongoose for data persistence.

### Request Lifecycle

A typical API request follows this flow:

1. A client sends an HTTP request.
2. Express receives the request and applies the configured middleware.
3. The request is routed to the appropriate API handler.
4. The application performs the required processing and database operations.
5. The backend returns an HTTP response to the client.

The exact processing layers depend on the implementation of each module.

---

## Project Structure

```text
train-booking-backend/
├── src/
│   ├── config/          # Application and infrastructure configuration
│   ├── modules/         # Feature and business-related modules
│   ├── public/          # Static assets served by the application
│   ├── shared/          # Reusable components
│   ├── app.js            # Express application configuration
│   └── server.js         # Server entry point
├── scripts/
│   └── seed.js           # Data seeding script
├── documents/            # Project documents
├── docker/               # Docker-related resources
├── postman/              # API testing resources
├── .env.example          # Example environment configuration
├── .dockerignore         # Files excluded from Docker build context
├── .gitignore             # Git ignore rules
├── Dockerfile             # Docker image definition
├── compose.yaml           # Docker Compose configuration
├── package.json           # Dependencies and npm scripts
├── package-lock.json      # Locked dependency versions
├── openapi.json           # OpenAPI specification in JSON
└── swagger.yaml           # Swagger/OpenAPI specification
```

Some files, including the Docker configuration, may differ depending on the current branch or deployment setup.

---

## Configuration

The application uses environment variables to configure its runtime and external services.

Create a local `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Configure the required values in `.env`:

```dotenv
PORT=5000
HOSTNAME=localhost

MONGODB_URL=your_mongodb_connection_string
DB_MAX_POOL=20
DB_MIN_POOL=2

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_URL=your_redis_connection_string
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port on which the backend listens |
| `HOSTNAME` | Hostname configuration, if used by the application |
| `MONGODB_URL` | MongoDB connection string |
| `DB_MAX_POOL` | Maximum database connection pool size, if configured |
| `DB_MIN_POOL` | Minimum database connection pool size, if configured |
| `JWT_ACCESS_SECRET` | Secret used for access-token operations |
| `JWT_REFRESH_SECRET` | Secret used for refresh-token operations |
| `JWT_ACCESS_EXPIRES` | Access-token expiration setting |
| `JWT_REFRESH_EXPIRES` | Refresh-token expiration setting |
| `REDIS_URL` | Redis connection string, if Redis is enabled |

Use valid credentials for the services required by the application. Redis configuration is only necessary if the current implementation initializes and uses Redis.

**Security considerations:**

- Never commit `.env` or real credentials to version control.
- Keep `.env.example` free of real secrets.
- Use strong, independently generated JWT secrets.
- Configure database network access and credentials appropriately.
- Provide production secrets through the deployment environment or a secrets manager.

---

## Getting Started

### Prerequisites

For local development, install:

- [Node.js](https://nodejs.org/)
- npm
- A MongoDB instance, such as [MongoDB Atlas](https://www.mongodb.com/atlas)
- Redis, if required by the current application configuration

### 1. Clone the Repository

```bash
git clone https://github.com/lam0311/train-booking-backend
cd train-booking-backend
```

Replace the placeholder with the actual repository URL.

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

Create `.env` from `.env.example` and configure the required connection strings and secrets.

### 4. Start the Development Server

```bash
npm run dev
```

The development script uses Nodemon to restart the server when files change.

### 5. Start the Production Server Locally

```bash
npm start
```

By default, the application uses port `5000`, unless overridden by the environment configuration.

---

## Docker Deployment

Docker allows the backend to run in a consistent environment without requiring Node.js to be installed directly on the deployment machine.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine
- Docker Compose
- A valid `.env` file

### Pull and Run from DockerHub

If you prefer to run the pre-built image without building it from source, use the following commands.

**Docker Image:** `thanhtran22096/train-booking-backend:1.0`

Pull the image:

```bash
docker pull thanhtran22096/train-booking-backend:1.0
```

Create a `.env` file containing the required environment variables, then run the container:

```bash
docker run -d \
  --name train-booking-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  YOUR_USERNAME/train-booking-backend:1.0
```

The API will be available at `http://localhost:5000`.

To view the container logs:

```bash
docker logs -f train-booking-backend
```

To stop the container:

```bash
docker stop train-booking-backend
```

To remove the container:

```bash
docker rm train-booking-backend
```

**Note:** Replace `YOUR_USERNAME` with your DockerHub username. The `.env` file must contain valid configuration values for the required external services, such as MongoDB.


### 1. Build and Start the Application

From the project root, run:

```bash
docker compose up --build -d
```

This command builds the image if necessary and starts the configured containers in detached mode.

### 2. Check Container Status

```bash
docker compose ps
```

### 3. View Application Logs

```bash
docker compose logs -f backend
```

Press `Ctrl+C` to stop following the logs.

### 4. Stop the Application

```bash
docker compose down
```

### 5. Rebuild After Code Changes

```bash
docker compose up -d --build
```

### Configuration Notes

- The backend container exposes port `5000` by default.
- The `.env` file supplies runtime environment variables.
- MongoDB Atlas and an external Redis service can remain outside Docker.
- Ensure `.env` is not copied into the Docker image.
- The application image and the database are separate resources; rebuilding the image does not automatically provision external database services.

---

## API Documentation

The project includes Swagger/OpenAPI documentation.

When the application is running locally, open:

- **Swagger UI:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI JSON file:** `openapi.json`

The Swagger UI allows developers to inspect documented endpoints, review request and response schemas, and test supported API operations.

The available endpoints and authentication requirements are defined by the current API implementation and specification.

### API Endpoints

The API is organized into the following functional groups:

| Group | Endpoint | Method | Description |
|---|---|---|---|
| **System** | `/health/live` | GET | Checks whether the application is running |
| **System** | `/health/ready` | GET | Checks application readiness |
| **System** | `/openapi.json` | GET | Retrieves the OpenAPI specification |
| **Authentication** | `/api/v1/auth/register` | POST | Registers a new account |
| **Authentication** | `/api/v1/auth/login` | POST | Authenticates a user and issues tokens |
| **Authentication** | `/api/v1/auth/refresh` | POST | Refreshes the access token |
| **Authentication** | `/api/v1/auth/logout` | POST | Logs out and handles token revocation according to the implementation |
| **Stations** | `/stations` | GET | Retrieves station information and station indexes |
| **Trips** | `/trips` | GET | Searches for trips based on route and travel date |
| **Trips** | `/trips/{tripId}/seats?from=&to=` | GET | Retrieves seat availability for a specified trip segment |
| **Bookings** | `/bookings` | POST | Creates a booking for a selected trip segment |
| **Bookings** | `/bookings/me` | GET | Retrieves the authenticated user's bookings |
| **Bookings** | `/bookings/{bookingId}` | GET | Retrieves a booking by ID, subject to authorization |
| **Bookings** | `/bookings/{bookingId}` | DELETE | Cancels a booking, subject to authorization |

Refer to Swagger UI for the complete endpoint definitions, request parameters, request bodies, response schemas, and authentication requirements.

### Typical Booking Workflow

A typical booking workflow consists of the following steps:

1. **Authenticate:** Call `POST /api/v1/auth/login` to obtain an access token and refresh token.
2. **Search trips:** Call `GET /trips?from=&to=&date=` with the required route and travel date parameters.
3. **Check seat availability:** Call `GET /trips/{tripId}/seats?from=&to=` to inspect available seats for the selected segment.
4. **Create a booking:** Call `POST /bookings` with the required booking details and a valid access token.
5. **Manage bookings:** Use `GET /bookings/me` to view personal bookings, `GET /bookings/{bookingId}` to retrieve a booking, or `DELETE /bookings/{bookingId}` to request cancellation.

### Segment-Based Booking

The system supports booking seats for a specific segment of a train journey. A seat's occupied-segment mask represents the segments in which it is unavailable.

For a train with five stations indexed from `0` to `4`, there are four segments. A journey from station index `fromIndex` to `toIndex` occupies the segments from `fromIndex` through `toIndex - 1`.

For example:

- `0 → 2`: occupies segments `0` and `1`.
- `2 → 4`: occupies segments `2` and `3`.
- `0 → 4`: occupies all four segments.

Two bookings for the same physical seat may coexist if their occupied segments do not overlap, subject to the application's booking validation rules.



---

## Health Checks

The application provides health-check endpoints.

| Endpoint | Purpose |
|---|---|
| `GET /health/live` | Checks whether the application is running |
| `GET /health/ready` | Checks whether the application is ready, including database readiness |

Example:

```bash
curl http://localhost:5000/health/live
```

Check database readiness:

```bash
curl http://localhost:5000/health/ready
```

A successful liveness response does not necessarily mean all external dependencies are available. Use the readiness endpoint to check the application's readiness condition.

---

## Development

### Available npm Scripts

| Command | Description |
|---|---|
| `npm start` | Starts the backend server |
| `npm run dev` | Starts the development server with Nodemon |
| `npm run seed` | Executes the data seeding script |
| `npm run lint` | Runs the configured linting checks |
| `npm run lint:fix` | Runs automatic lint fixes, if supported by the current configuration |

Review `package.json` for the exact scripts and options available in the current version.

### Seeding Data

The project contains `scripts/seed.js` for data seeding.

Before executing:

```bash
npm run seed
```

review the script to understand which database it connects to and whether it creates, updates, or deletes data. Always use the intended development database when testing data seeding.

### Branching and Contributions

For collaborative development:

1. Create a feature branch.
2. Make and test your changes.
3. Commit the changes with a descriptive message.
4. Push the branch to the remote repository.
5. Open a pull request for review, if required by the team workflow.

Do not commit secrets, generated credentials, or local `.env` files.

---

## Troubleshooting

### MongoDB Connection Failure

Check that:

- `MONGODB_URL` is valid.
- Database credentials are correct.
- The database allows connections from the deployment environment.
- The database service is available.

### Container Exits Immediately

Inspect the logs:

```bash
docker compose logs backend
```

Look for missing environment variables, failed database connections, missing files, or startup errors.

### Port Already in Use

If port `5000` is occupied, change the host-side port mapping in `compose.yaml`, for example:

```yaml
ports:
  - "5001:5000"
```

The backend still listens on port `5000` inside the container, while clients access it through port `5001` on the host.

### Swagger UI Does Not Load

Verify that `swagger.yaml` is present at the path expected by the application and that the server has started successfully.

---

## License

Add the applicable license information here before distributing the project publicly.
