const db = require('../config/db');
const { calculateMatchScore } = require('../utils/matching');

const getJobRecommendations = async (req, res) => {
  try {
    const candidateResult = await db.query(
      `SELECT c.*, COALESCE(string_agg(s.skill_name, ', '), '') AS skills
       FROM candidates c
       LEFT JOIN candidate_skills cs ON c.user_id = cs.user_id
       LEFT JOIN skills s ON cs.skill_id = s.skill_id
       WHERE c.user_id = $1
       GROUP BY c.user_id`,
      [req.user.id]
    );

    const candidate = candidateResult.rows[0];
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found' });

    const jobsResult = await db.query(
      `SELECT jp.*, e.company_name, COALESCE(string_agg(s.skill_name, ', '), '') AS required_skills
       FROM job_postings jp
       JOIN employers e ON jp.user_id = e.user_id
       LEFT JOIN job_skills js ON jp.job_id = js.job_id
       LEFT JOIN skills s ON js.skill_id = s.skill_id
       GROUP BY jp.job_id, e.company_name`
    );

    const recommendations = jobsResult.rows
      .map(job => ({
        ...job,
        matchScore: calculateMatchScore(candidate, job)
      }))
      .filter(job => job.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    const limited = candidate.is_member ? recommendations : recommendations.slice(0, 10);

    return res.json({
      message: 'Job recommendations generated successfully',
      membershipStatus: candidate.is_member ? 'member' : 'free',
      limitApplied: candidate.is_member ? 'unlimited' : 'top 10',
      recommendations: limited
    });
  } catch (error) {
    return res.status(500).json({ message: 'Job recommendation failed', error: error.message });
  }
};

const getCandidateRecommendations = async (req, res) => {
  try {
    const { jobId } = req.params;

    const employerResult = await db.query('SELECT * FROM employers WHERE user_id = $1', [req.user.id]);
    const employer = employerResult.rows[0];
    if (!employer) return res.status(404).json({ message: 'Employer profile not found' });

    const jobResult = await db.query(
      `SELECT jp.*, COALESCE(string_agg(s.skill_name, ', '), '') AS required_skills
       FROM job_postings jp
       LEFT JOIN job_skills js ON jp.job_id = js.job_id
       LEFT JOIN skills s ON js.skill_id = s.skill_id
       WHERE jp.job_id = $1 AND jp.user_id = $2
       GROUP BY jp.job_id`,
      [jobId, req.user.id]
    );

    const job = jobResult.rows[0];
    if (!job) return res.status(404).json({ message: 'Job posting not found for this employer' });

    const candidatesResult = await db.query(
      `SELECT c.*, u.email, COALESCE(string_agg(s.skill_name, ', '), '') AS skills
       FROM candidates c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN candidate_skills cs ON c.user_id = cs.user_id
       LEFT JOIN skills s ON cs.skill_id = s.skill_id
       GROUP BY c.user_id, u.email`
    );

    const recommendations = candidatesResult.rows
      .map(candidate => ({
        ...candidate,
        matchScore: calculateMatchScore(candidate, job)
      }))
      .filter(candidate => candidate.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    const limited = employer.is_member ? recommendations : recommendations.slice(0, 10);

    return res.json({
      message: 'Candidate recommendations generated successfully',
      membershipStatus: employer.is_member ? 'member' : 'free',
      limitApplied: employer.is_member ? 'unlimited' : 'top 10',
      recommendations: limited
    });
  } catch (error) {
    return res.status(500).json({ message: 'Candidate recommendation failed', error: error.message });
  }
};

module.exports = { getJobRecommendations, getCandidateRecommendations };
