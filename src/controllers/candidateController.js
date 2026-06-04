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

const updateCandidateProfile = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.id;
    const {
      fullName,
      contactInfo,
      educationLevel,
      major,
      yearsExperience,
      workExperience,
      preferredWorkMode,
      preferredLocation,
      skills,
      isMember
    } = req.body;

    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE candidates
       SET full_name = COALESCE($1, full_name),
           contact_info = COALESCE($2, contact_info),
           education_level = COALESCE($3, education_level),
           major = COALESCE($4, major),
           years_experience = COALESCE($5, years_experience),
           work_experience = COALESCE($6, work_experience),
           pref_work_mode = COALESCE($7, pref_work_mode),
           pref_location = COALESCE($8, pref_location),
           is_member = COALESCE($9, is_member)
       WHERE user_id = $10
       RETURNING *`,
      [
        fullName,
        contactInfo,
        educationLevel,
        major,
        yearsExperience,
        workExperience,
        preferredWorkMode,
        preferredLocation,
        typeof isMember === 'boolean' ? isMember : null,
        userId
      ]
    );

    if (skills) {
      await client.query('DELETE FROM candidate_skills WHERE user_id = $1', [userId]);
      const skillIds = await upsertSkills(client, skills);
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO candidate_skills (user_id, skill_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userId, skillId]
        );
      }
    }

    await client.query('COMMIT');

    return res.json({
      message: 'Candidate profile saved successfully',
      candidate: updated.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Candidate profile update failed', error: error.message });
  } finally {
    client.release();
  }
};

const getCandidateProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, COALESCE(string_agg(s.skill_name, ', '), '') AS skills
       FROM candidates c
       LEFT JOIN candidate_skills cs ON c.user_id = cs.user_id
       LEFT JOIN skills s ON cs.skill_id = s.skill_id
       WHERE c.user_id = $1
       GROUP BY c.user_id`,
      [req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ message: 'Candidate profile not found' });

    return res.json({ candidate: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load candidate profile', error: error.message });
  }
};

const searchCandidates = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const workMode = req.query.workMode || null;
    const minExperience = req.query.minExperience ? Number(req.query.minExperience) : null;
    const searchTerm = `%${keyword}%`;

    const result = await db.query(
      `SELECT c.*, u.email, COALESCE(string_agg(s.skill_name, ', '), '') AS skills,
              GREATEST(
                similarity(COALESCE(c.full_name, ''), $1),
                similarity(COALESCE(c.education_level, ''), $1),
                similarity(COALESCE(c.major, ''), $1),
                similarity(COALESCE(c.work_experience, ''), $1),
                similarity(COALESCE(c.pref_location, ''), $1),
                similarity(COALESCE(c.pref_work_mode, ''), $1),
                similarity(COALESCE(string_agg(s.skill_name, ', '), ''), $1)
              ) AS fuzzy_score
       FROM candidates c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN candidate_skills cs ON c.user_id = cs.user_id
       LEFT JOIN skills s ON cs.skill_id = s.skill_id
       GROUP BY c.user_id, u.email
       HAVING (
          $1 = ''
          OR c.full_name ILIKE $2
          OR c.education_level ILIKE $2
          OR c.major ILIKE $2
          OR c.work_experience ILIKE $2
          OR c.pref_location ILIKE $2
          OR c.pref_work_mode ILIKE $2
          OR COALESCE(string_agg(s.skill_name, ', '), '') ILIKE $2
          OR GREATEST(
                similarity(COALESCE(c.full_name, ''), $1),
                similarity(COALESCE(c.education_level, ''), $1),
                similarity(COALESCE(c.major, ''), $1),
                similarity(COALESCE(c.work_experience, ''), $1),
                similarity(COALESCE(c.pref_location, ''), $1),
                similarity(COALESCE(c.pref_work_mode, ''), $1),
                similarity(COALESCE(string_agg(s.skill_name, ', '), ''), $1)
             ) > 0.25
       )
       AND ($3::varchar IS NULL OR c.pref_work_mode = $3)
       AND ($4::numeric IS NULL OR c.years_experience >= $4)
       ORDER BY fuzzy_score DESC, c.years_experience DESC`,
      [keyword, searchTerm, workMode, minExperience]
    );

    return res.json({ message: 'Candidate search completed', results: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Candidate search failed', error: error.message });
  }
};

module.exports = { updateCandidateProfile, getCandidateProfile, searchCandidates };
