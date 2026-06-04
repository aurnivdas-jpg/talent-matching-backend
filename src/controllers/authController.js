const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerUser = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { email, password, role, fullName, companyName, contactInfo, companyInfo } = req.body;
    console.log(req.body);
console.log("RAW ROLE:", role);
    const normalizedRole = role.trim().toLowerCase();
    const dbRole = normalizedRole === "candidate" ? "Candidate" : "Employer";
        console.log("ROLE SENT TO DB:", normalizedRole);
            const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, role`,
       [email.toLowerCase(), passwordHash, dbRole]
           );

    const user = userResult.rows[0];

    if (normalizedRole === 'candidate') {
      await client.query(
        `INSERT INTO candidates (user_id, full_name, contact_info)
         VALUES ($1, $2, $3)`,
        [user.user_id, fullName, contactInfo || email]
      );
    }

    if (normalizedRole === 'employer') {
      await client.query(
        `INSERT INTO employers (user_id, company_name, company_info, contact_info)
         VALUES ($1, $2, $3, $4)`,
        [user.user_id, companyName || fullName, companyInfo || null, contactInfo || email]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    return res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    client.release();
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT user_id, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.user_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
