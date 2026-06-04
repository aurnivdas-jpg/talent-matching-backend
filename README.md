# Talent Matching PostgreSQL Backend

This backend matches the implemented PostgreSQL/Supabase database schema for the CSIT314 Intelligent Talent Matching Platform.

## Features

- Node.js + Express REST API
- PostgreSQL/Supabase connection using `pg`
- JWT authentication
- bcrypt password hashing
- Candidate and employer role authorization
- Candidate profile management
- Employer job posting management
- Skill tables and junction tables
- Membership-based recommendation limits
- PostgreSQL `pg_trgm` fuzzy search using `similarity()`
- GitHub Actions CI workflow

## Method Names for Sequence Diagram

Use these real backend method names in the sequence diagram:

- `registerUser()`
- `loginUser()`
- `protect()`
- `authorizeRoles()`
- `updateCandidateProfile()`
- `getCandidateProfile()`
- `searchCandidates()`
- `createJobPosting()`
- `getJobs()`
- `searchJobs()`
- `getJobRecommendations()`
- `getCandidateRecommendations()`
- `updateMembership()`
- `calculateMatchScore()`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Open `.env` and paste the Supabase PostgreSQL connection string:

```env
PORT=5050
JWT_SECRET=change_this_to_a_long_random_secret
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres
```

Never commit `.env` to GitHub.

4. Start backend:

```bash
npm start
```

5. Check database connection:

```text
http://localhost:5050/health
```

## API Endpoints

### Authentication

`POST /api/auth/register`

Candidate body:

```json
{
  "fullName": "Aurniv Das",
  "email": "aurniv@test.com",
  "password": "123456",
  "role": "candidate",
  "contactInfo": "aurniv@test.com"
}
```

Employer body:

```json
{
  "fullName": "Tech Company",
  "companyName": "Tech Company",
  "email": "company@test.com",
  "password": "123456",
  "role": "employer",
  "companyInfo": "Software recruitment company",
  "contactInfo": "company@test.com"
}
```

`POST /api/auth/login`

```json
{
  "email": "aurniv@test.com",
  "password": "123456"
}
```

### Candidate Profile

`POST /api/candidates/profile`

Requires candidate Bearer token.

```json
{
  "fullName": "Aurniv Das",
  "contactInfo": "aurniv@test.com",
  "educationLevel": "Bachelor Degree",
  "major": "Information Technology",
  "yearsExperience": 1,
  "workExperience": "Backend development and API testing experience",
  "preferredWorkMode": "Hybrid",
  "preferredLocation": "Sydney",
  "skills": "Node.js, SQL, Express, PostgreSQL"
}
```

### Employer Job Posting

`POST /api/jobs`

Requires employer Bearer token.

```json
{
  "jobTitle": "Backend Developer",
  "jobDescription": "Looking for a Node.js backend developer with SQL and API experience",
  "requiredEducation": "Bachelor Degree",
  "requiredExperience": 1,
  "workMode": "Hybrid",
  "jobLocation": "Sydney",
  "requiredSkills": "Node.js, SQL, Express, PostgreSQL"
}
```

### Search

Job fuzzy search:

```text
GET /api/jobs/search?keyword=sofware enginer
```

Candidate fuzzy search:

```text
GET /api/candidates/search?keyword=postgress
```

### Recommendations

Candidate job recommendations:

```text
GET /api/recommendations/jobs
```

Employer candidate recommendations for a job:

```text
GET /api/recommendations/candidates/:jobId
```

### Membership

```text
PATCH /api/membership
```

```json
{
  "isMember": true
}
```

## GitHub Actions

The CI workflow is stored at `.github/workflows/ci.yml`.
