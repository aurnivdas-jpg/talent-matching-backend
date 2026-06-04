-- Supabase/PostgreSQL schema for Intelligent Talent Matching Platform
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS USERS (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'employer'))
);

CREATE TABLE IF NOT EXISTS EMPLOYERS (
    user_id UUID PRIMARY KEY REFERENCES USERS(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_info TEXT,
    contact_info VARCHAR(255),
    is_member BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS CANDIDATES (
    user_id UUID PRIMARY KEY REFERENCES USERS(user_id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    education_level VARCHAR(100),
    major VARCHAR(100),
    years_experience NUMERIC(4,1),
    work_experience TEXT,
    pref_work_mode VARCHAR(50),
    pref_location VARCHAR(100),
    is_member BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS JOB_POSTINGS (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES EMPLOYERS(user_id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT NOT NULL,
    req_education VARCHAR(100),
    req_experience NUMERIC(4,1),
    work_mode VARCHAR(50),
    job_location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS SKILLS (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS CANDIDATE_SKILLS (
    user_id UUID REFERENCES CANDIDATES(user_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES SKILLS(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS JOB_SKILLS (
    job_id UUID REFERENCES JOB_POSTINGS(job_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES SKILLS(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS APPLICATIONS (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES CANDIDATES(user_id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES JOB_POSTINGS(job_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
