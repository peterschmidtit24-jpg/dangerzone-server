# Dangerzone Server

This folder contains the Express and MongoDB backend for the Dangerzone app.
The server provides the REST API used by the React client to load city
incidents, register and authenticate users, create comments, and manage
admin-only moderation actions.

## Purpose

The server is responsible for:

- storing users, incidents, and comments in MongoDB
- exposing public read routes for incidents and comments
- protecting create, update, delete, and admin actions with JWT authentication
- hashing user passwords before storing them
- verifying logged-in users through `/api/auth/verify`
- resolving street addresses to map coordinates through geocoding services
- returning structured error messages to the frontend where possible

The React client talks to this API through its `VITE_SERVER_URL` setting.
When the server runs locally, the API is usually available at:

```bash
http://localhost:5005/api
```

The root health check is available at:

```bash
http://localhost:5005
```

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs
- CORS
- Morgan request logging

## How To Run

Install dependencies once:

```bash
npm install
```

Start the server:

```bash
npm start
```

For development with automatic restart when files change:

```bash
npm run dev
```

The server uses `PORT` from `.env.local` if it exists. If no port is set, it
uses port `5005`.

## Environment Variables

Create a `.env.local` file in `dangerzone-server/`.

Example:

```bash
PORT=5005
ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/dangerzone
TOKEN_SECRET=replace-this-with-a-long-secret
```

For production, `MONGODB_URI` should point to MongoDB Atlas or another hosted
MongoDB database. Do not commit real credentials or production secrets to Git.

## Main Files

```md
server.js
Starts the Express app, loads environment variables, connects middleware,
connects MongoDB on incoming requests, mounts routes under /api, and starts
the local server.

config/index.js
Configures CORS, request logging, JSON body parsing, and URL-encoded body
parsing.

db/index.js
Connects Mongoose to MongoDB using MONGODB_URI.

routes/
Contains the route files for auth, incidents, comments, users, and geocoding.

models/
Contains the Mongoose models for User, Incident, and Comment.

middlewares/auth.middlewares.js
Contains JWT verification and admin-role verification.

errors/index.js
Contains the 404 handler and generic server error handler.

seed-data/
Contains JSON seed/reference data for users, incidents, and comments.
```

## Data Models

### User

Users can register, log in, create incidents, post comments, and own content.
Admins can moderate users, incidents, and comments.

Important fields:

- `email`
- `password`
- `username`
- `role`: `user` or `admin`
- `warnings`
- `warnedAt`

Passwords are hashed with bcrypt before they are saved.

### Incident

Incidents describe a city danger or infrastructure problem.

Important fields:

- `incidentType`: `fire`, `pothole`, `crime`, `accident`, `crowded`, `water`,
  `broken`, `litter`, `speed`, or `other`
- `location`
- `lat`
- `lng`
- `severity`: `low`, `medium`, or `high`
- `probableDuration`: `hours` or `days`
- `description`
- `active`
- `createdBy`: reference to `User`
- `comments`: references to `Comment`

### Comment

Comments belong to users and can be attached to incidents.

Important fields:

- `user`: reference to `User`
- `comment`
- `flag`: `normal`, `suspicious`, or `toxic`

## Authentication

The server uses JWT authentication.

The frontend sends the token in the request header:

```bash
Authorization: Bearer <token>
```

The `verifyToken` middleware:

- reads the token from the `Authorization` header
- verifies it with `TOKEN_SECRET`
- checks that the user still exists
- attaches the current user data to `req.payload`

The `verifyAdmin` middleware allows access only when `req.payload.role` is
`admin`.

## Available API Routes

### Auth

```bash
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/verify
```

`/auth/signup` creates a user. `/auth/login` returns a JWT. `/auth/verify`
checks whether the saved token is still valid.

### Incidents

```bash
GET    /api/all-incidents
GET    /api/incident/:incidentId
POST   /api/incident
PUT    /api/incident/:incidentId
DELETE /api/incident/:incidentId
```

Public:

- `GET /api/all-incidents`
- `GET /api/incident/:incidentId`

Protected:

- `POST /api/incident`
- `PUT /api/incident/:incidentId`
- `DELETE /api/incident/:incidentId`

Only the incident owner or an admin can update an incident. Deleting an
incident also deletes its attached comments.

### Comments

```bash
GET    /api/all-comments
GET    /api/all-comments/user/:userId
GET    /api/comment/:commentId
POST   /api/comment/incident/:incidentId
PUT    /api/comment/:commentId
DELETE /api/comment/:commentId
```

Public:

- comment read routes

Protected:

- creating a comment
- updating a comment
- deleting a comment

Only the comment owner or an admin can update or delete a comment.

### Users

```bash
GET    /api/all-users
GET    /api/user/:userId
PUT    /api/user/:userId
PUT    /api/user/:userId/warn
DELETE /api/user/:userId
```

Updating or deleting a user requires authentication. A user can edit/delete
their own account. Admins can manage other users. Warning users is admin-only.

Deleting a user also removes:

- incidents created by that user
- comments created by that user
- comments attached to deleted incidents
- comment references from remaining incidents

### Geocoding

```bash
GET /api/geocode?q=<address>
```

The geocoding route searches address coordinates through external services and
returns possible matches. Results are cached in memory for repeated queries.
The current search logic is optimized around Berlin.

## Permissions Summary

Guests can:

- load incidents
- open incident details
- read comments
- search addresses through geocoding

Logged-in users can:

- create incidents
- comment on incidents
- edit/delete their own incidents
- edit/delete their own comments
- edit/delete their own user account

Admins can:

- edit/delete any incident
- edit/delete any comment
- warn users
- delete users

## Error Handling

Routes return specific `errorMessage` responses for expected problems, for
example:

```json
{ "errorMessage": "Incident not found" }
```

Unexpected errors are passed to the centralized error handler in
`errors/index.js`, logged on the server, and returned as a generic 500 response.

Common error cases:

- invalid or missing token
- missing user, incident, or comment
- insufficient permissions
- invalid signup data
- address search failure
- database connection problems

## Data Handling Notes

The server stores data in MongoDB through Mongoose models. Relations are stored
with ObjectId references:

- `Incident.createdBy` references `User`
- `Incident.comments` references `Comment`
- `Comment.user` references `User`

Incident routes populate related users and comments before sending data to the
frontend, so the client can display reporter and comment author information.

## Deployment Notes

For a real deployment:

1. Create a hosted MongoDB database, for example MongoDB Atlas.
2. Set `MONGODB_URI` in the deployed server environment.
3. Set `TOKEN_SECRET` to a strong secret value.
4. Set `ORIGIN` to the deployed frontend URL.
5. Set the frontend `VITE_SERVER_URL` to the deployed server URL.

Make sure Atlas Network Access allows connections from the deployed backend.

## Common Checks

If the frontend cannot load data:

- Check that the server is running.
- Check that MongoDB is running or Atlas is reachable.
- Check `MONGODB_URI`.
- Check that the frontend `VITE_SERVER_URL` points to the correct backend.
- Check that `ORIGIN` allows the frontend URL.
- Open `http://localhost:5005/api/all-incidents` in the browser.
- Check the server terminal for database or route errors.

If login does not work:

- Check `TOKEN_SECRET`.
- Check that the user exists in MongoDB.
- Check that the frontend is sending requests to the correct server.
- Check the browser Network tab for the exact API response.
