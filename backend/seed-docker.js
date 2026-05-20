const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
  host: 'postgres',
  port: 5432,
  user: 'medical_user',
  password: 'medical123',
  database: 'medical_db'
});

(async () => {
  await client.connect();

  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='users'
  `);
  console.log('Columns:', cols.rows.map(r => r.column_name));

  const password = await bcrypt.hash('password123', 10);

  const accounts = [
    ['Admin',  'System',    'admin@med.com',       'admin'],
    ['Ion',    'Popescu',   'doctor@med.com',       'doctor'],
    ['Maria',  'Reception', 'reception@med.com',    'receptionist'],
    ['Andrei', 'Radiolog',  'radiolog@med.com',     'radiologist'],
    ['Elena',  'Lab',       'lab@med.com',          'lab_technician']
  ];

  for (const [fn, ln, email, role] of accounts) {
    await client.query(
      `INSERT INTO users ("firstName", "lastName", email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [fn, ln, email, password, role]
    );
    console.log('Created:', email, '| role:', role);
  }

  // Ensure tutorial_progress table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutorial_progress (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "tutorialId" VARCHAR NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      "completedAt" TIMESTAMP,
      rating INTEGER,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
  console.log('Table tutorial_progress: OK');

  const result = await client.query('SELECT id, email, role FROM users ORDER BY id');
  console.log('\nAll users:');
  result.rows.forEach(r => console.log(` #${r.id} ${r.email} [${r.role}]`));

  await client.end();
  console.log('\nDONE!');
})().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
