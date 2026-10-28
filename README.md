# Intelligent Talent Matching Platform — Backend

**REST API for a university team project connecting candidates with employers.**

Built using Node.js, Express and PostgreSQL (Supabase). The backend supports candidate and employer accounts, job postings, skill-based recommendations and fuzzy searching for jobs and candidates.

> **Scope:** This repository contains the backend, not the complete user interface. The recommendation logic is a rule-based scoring function, not a trained AI or machine-learning model.

## Tech stack

- **Runtime and API:** Node.js, Express
- **Database:** PostgreSQL, hosted with Supabase during development
- **Authentication:** JSON Web Tokens (JWT), bcryptjs for password hashing
- **Search:** PostgreSQL `pg_trgm` and `similarity()`
- **Validation and middleware:** express-validator, Helmet, CORS
- **CI:** GitHub Actions with syntax check and a basic smoke test

## Features

- Candidate and employer registration and login
- Role-based access middleware for protected endpoints
- Candidate profiles with education, experience, work preferences and skills
- Employer job postings and required skills
- Candidate and job search with filters and typo-tolerant PostgreSQL matching
- Rule-based recommendations ranked by skills, education, experience, location and work mode
- Membership-dependent recommendation limits
- Relational schema with user, candidate, employer, job, skill and application tables

## Repository structure

```text
src/
  config/             # PostgreSQL connection
  controllers/        # Request handling and SQL queries
  middleware/         # Authentication and authorisation
  routes/             # REST API endpoints
  tests/              # Basic smoke-test script
  utils/              # Matching and validation helpers
schema.sql            # PostgreSQL schema
.github/workflows/    # CI pipeline
.env.example          # Local environment variable template
```

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a candidate or employer |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `POST` | `/api/candidates/profile` | Update a candidate profile |
| `GET` | `/api/candidates/search?keyword=...` | Search candidates |
| `POST` | `/api/jobs` | Create a job posting |
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/search?keyword=...` | Search jobs |
| `GET` | `/api/recommendations/jobs` | Recommend jobs for a candidate |
| `GET` | `/api/recommendations/candidates/:jobId` | Recommend candidates for an employer's job |
| `PATCH` | `/api/membership` | Update membership status |
| `GET` | `/health` | Check database connectivity |

Protected routes require a JWT in the `Authorization: Bearer <token>` header.

## Local setup

**Requirements:** Node.js and access to a PostgreSQL database.

1. Clone this repository and open the project directory.
2. Install packages with `npm install`.
3. Create a local `.env` file using `cp .env.example .env`.
4. Set `DATABASE_URL`, `JWT_SECRET` and `PORT` in your `.env` file.
5. Run `schema.sql` in your development PostgreSQL database.
6. Start the server using `npm start` (or `npm run dev` with Nodemon).
7. Check `http://localhost:5050/health` using the default port.

Never commit `.env`, live credentials or actual applicant information to GitHub.

### Example environment variables

```env
PORT=5050
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace_with_your_own_long_random_secret
```

### Checks

```bash
npm run lint
npm test
```

The existing GitHub Actions workflow runs these commands. **The current test is only a basic smoke-test placeholder**; it is not a full API, database or security test suite.

## How the matching works

The `calculateMatchScore()` function in `src/utils/matching.js` assigns up to 100 points: matching skills (40), education (15), sufficient experience (20), work mode (10) and location (15). Results are ranked by that score. This provides an explainable baseline rather than a trained recommendation model.

## Before production use

This is an educational backend and **is not production-ready**. In particular:

- Registration currently logs request bodies. Remove this logging before using real personal data or passwords.
- Check the stored `role` values against the schema constraint: the registration controller uses capitalised roles, but `schema.sql` permits lowercase roles.
- Tighten database TLS verification, error responses, validation and access controls.
- Add proper automated API and database integration tests.
- Review how membership status is changed and who is permitted to modify it.
- Deploy only after testing authentication, database configuration and permissions.

## Suggested portfolio additions

Add an API demonstration, architecture diagram, database ERD and a short explanation of your own responsibilities in the team. Keep those responsibilities accurate and specific.
