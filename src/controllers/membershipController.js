const db = require('../config/db');

const updateMembership = async (req, res) => {
  try {
    const { isMember } = req.body;
    const table = req.user.role === 'candidate' ? 'candidates' : 'employers';

    const result = await db.query(
      `UPDATE ${table}
       SET is_member = $1
       WHERE user_id = $2
       RETURNING user_id, is_member`,
      [Boolean(isMember), req.user.id]
    );

    return res.json({
      message: 'Membership status updated successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Membership update failed', error: error.message });
  }
};

module.exports = { updateMembership };
