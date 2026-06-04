const db = require('../config/db');
const { normalizeList } = require('../utils/matching');

async function upsertSkills(client, skillNames) {
  const skillIds = [];

  for (const skill of normalizeList(skillNames).map(s => s.replace(/\b\w/g, c => c.toUpperCase()))) {
    const result = await client.query(
      `INSERT INTO skills (skill_name)
       VALUES ($1)
       ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name
       RETURNING skill_id`,
      [skill]
    );
    skillIds.push(result.rows[0].skill_id);
  }

  return skillIds;
}

const createJobPosting = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const employerId = req.user.id;
    const {
      jobTitle,
      jobDescription,
      requiredEducation,
      requiredExperience,
      workMode,
      jobLocation,
      requiredSkills
    } = req.body;

    await client.query('BEGIN');

    const jobResult = await client.query(
      `INSERT INTO job_postings
       (user_id, job_title, job_description, req_education, req_experience, work_mode, job_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        employerId,
        jobTitle,
        jobDescription,
        requiredEducation || null,
        requiredExperience || 0,
        workMode || null,
        jobLocation || null
      ]
    );

    const job = jobResult.rows[0];

    if (requiredSkills) {
      const skillIds = await upsertSkills(client, requiredSkills);
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO job_skills (job_id, skill_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [job.job_id, skillId]
        );
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Job posting created successfully',
      job
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Job posting creation failed', error: error.message });
  } finally {
    client.release();
  }
};

const getJobs = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT jp.*, e.company_name, COALESCE(string_agg(s.skill_name, ', '), '') AS required_skills
       FROM job_postings jp
       JOIN employers e ON jp.user_id = e.user_id
       LEFT JOIN job_skills js ON jp.job_id = js.job_id
       LEFT JOIN skills s ON js.skill_id = s.skill_id
       GROUP BY jp.job_id, e.company_name
       ORDER BY jp.job_title ASC`
    );

    return res.json({ jobs: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load jobs', error: error.message });
  }
};

const searchJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const workMode = req.query.workMode || null;
    const location = req.query.location || null;
    const minExperience = req.query.minExperience ? Number(req.query.minExperience) : null;
    const searchTerm = `%${keyword}%`;

    const result = await db.query(
      `SELECT jp.*, e.company_name, COALESCE(string_agg(s.skill_name, ', '), '') AS required_skills,
              GREATEST(
                similarity(COALESCE(jp.job_title, ''), $1),
                similarity(COALESCE(jp.job_description, ''), $1),
                similarity(COALESCE(jp.req_education, ''), $1),
                similarity(COALESCE(jp.work_mode, ''), $1),
                similarity(COALESCE(jp.job_location, ''), $1),
                similarity(COALESCE(string_agg(s.skill_name, ', '), ''), $1)
              ) AS fuzzy_score
       FROM job_postings jp
       JOIN employers e ON jp.user_id = e.user_id
       LEFT JOIN job_skills js ON jp.job_id = js.job_id
       LEFT JOIN skills s ON js.skill_id = s.skill_id
       GROUP BY jp.job_id, e.company_name
       HAVING (
          $1 = ''
          OR jp.job_title ILIKE $2
          OR jp.job_description ILIKE $2
          OR jp.req_education ILIKE $2
          OR jp.work_mode ILIKE $2
          OR jp.job_location ILIKE $2
          OR COALESCE(string_agg(s.skill_name, ', '), '') ILIKE $2
          OR GREATEST(
                similarity(COALESCE(jp.job_title, ''), $1),
                similarity(COALESCE(jp.job_description, ''), $1),
                similarity(COALESCE(jp.req_education, ''), $1),
                similarity(COALESCE(jp.work_mode, ''), $1),
                similarity(COALESCE(jp.job_location, ''), $1),
                similarity(COALESCE(string_agg(s.skill_name, ', '), ''), $1)
             ) > 0.25
       )
       AND ($3::varchar IS NULL OR jp.work_mode = $3)
       AND ($4::varchar IS NULL OR jp.job_location = $4)
       AND ($5::numeric IS NULL OR jp.req_experience <= $5)
       ORDER BY fuzzy_score DESC, jp.job_title ASC`,
      [keyword, searchTerm, workMode, location, minExperience]
    );

    return res.json({ message: 'Job search completed', results: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Job search failed', error: error.message });
  }
};

module.exports = { createJobPosting, getJobs, searchJobs };
