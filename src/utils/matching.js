function normalizeList(value) {
  if (!value) return [];
  return String(value)
    .toLowerCase()
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function calculateMatchScore(candidate, job) {
  let score = 0;

  const candidateSkills = normalizeList(candidate.skills || candidate.skill_names);
  const jobSkills = normalizeList(job.required_skills || job.skill_names);

  const matchedSkills = candidateSkills.filter(candidateSkill =>
    jobSkills.some(jobSkill =>
      jobSkill.includes(candidateSkill) || candidateSkill.includes(jobSkill)
    )
  );

  score += Math.min(matchedSkills.length * 20, 40);

  if (candidate.education_level && job.req_education) {
    const educationA = candidate.education_level.toLowerCase();
    const educationB = job.req_education.toLowerCase();
    if (educationA.includes(educationB) || educationB.includes(educationA)) score += 15;
  }

  const candidateExperience = Number(candidate.years_experience || 0);
  const requiredExperience = Number(job.req_experience || 0);
  if (candidateExperience >= requiredExperience) score += 20;

  if (candidate.pref_work_mode && job.work_mode &&
      candidate.pref_work_mode.toLowerCase() === job.work_mode.toLowerCase()) {
    score += 10;
  }

  if (candidate.pref_location && job.job_location &&
      candidate.pref_location.toLowerCase() === job.job_location.toLowerCase()) {
    score += 15;
  }

  return Math.min(score, 100);
}

module.exports = { calculateMatchScore, normalizeList };
