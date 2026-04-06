/**
 * Database Seed Script — PostgreSQL / Neon version
 * Populates the database with sample data for development/demo.
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding database...\n');
    await client.query('BEGIN');

    await client.query(`
      TRUNCATE TABLE notifications, tokens, queues, locations, organizations, users
      RESTART IDENTITY CASCADE
    `);
    console.log('  Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 12);

    const userRows = [
      ['Admin User', 'admin@smartqueue.com', '+91 98765 43210', 'admin'],
      ['Dr. Sarah Wilson', 'sarah@hospital.com', '+91 98765 43211', 'admin'],
      ['John Doe', 'john@example.com', '+91 98765 43212', 'user'],
      ['Jane Smith', 'jane@example.com', '+91 98765 43213', 'user'],
      ['Mike Johnson', 'mike@example.com', '+91 98765 43214', 'user'],
      ['Emily Davis', 'emily@example.com', '+91 98765 43215', 'user'],
      ['Robert Brown', 'robert@example.com', '+91 98765 43216', 'user'],
      ['Lisa Anderson', 'lisa@example.com', '+91 98765 43217', 'user'],
    ];

    const insertedUsers = [];
    for (const [name, email, phone, role] of userRows) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role`,
        [name, email, hashedPassword, phone, role]
      );
      insertedUsers.push(result.rows[0]);
    }
    console.log(`  Created ${insertedUsers.length} users`);

    const orgRows = [
      ['Default Organization', 'default@smartqueue.local', '__NO_LOGIN__', 'default'],
      ['City Hospital Group', 'hospital@provider.com', hashedPassword, 'hospital'],
      ['HealthFirst Network', 'healthfirst@provider.com', hashedPassword, 'clinic'],
      ['GovServ Solutions', 'govserv@provider.com', hashedPassword, 'government'],
    ];

    const insertedOrgs = [];
    for (const row of orgRows) {
      const result = await client.query(
        `INSERT INTO organizations (name, email, password_hash, type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email`,
        row
      );
      insertedOrgs.push(result.rows[0]);
    }
    console.log(`  Created ${insertedOrgs.length - 1} provider organizations`);

    const defaultOrgId = insertedOrgs.find((org) => org.email === 'default@smartqueue.local')?.id;
    const hospitalOrgId = insertedOrgs.find((org) => org.email === 'hospital@provider.com')?.id || defaultOrgId;
    const healthOrgId = insertedOrgs.find((org) => org.email === 'healthfirst@provider.com')?.id || defaultOrgId;
    const govOrgId = insertedOrgs.find((org) => org.email === 'govserv@provider.com')?.id || defaultOrgId;

    const locationRows = [
      [
        'City General Hospital', 'hospital',
        'A premier multi-specialty hospital offering comprehensive healthcare services with state-of-the-art facilities and experienced medical professionals.',
        '123 Medical Drive, HSR Layout', 'Bangalore', 'Karnataka',
        '+91 80 2345 6789', 'info@cityhospital.com', insertedUsers[0].id,
        '{"open": "08:00", "close": "20:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat"]}',
      ],
      [
        'HealthFirst Clinic', 'clinic',
        'Your neighborhood clinic providing primary healthcare, diagnostics, and preventive care with a personal touch.',
        '456 Wellness Street, Koramangala', 'Bangalore', 'Karnataka',
        '+91 80 3456 7890', 'care@healthfirst.com', insertedUsers[1].id,
        '{"open": "09:00", "close": "18:00", "days": ["Mon","Tue","Wed","Thu","Fri","Sat"]}',
      ],
      [
        'Government Services Center', 'government',
        'One-stop center for all government document services including passport, driving license, and certificate processing.',
        '789 Civic Center Road, MG Road', 'Bangalore', 'Karnataka',
        '+91 80 4567 8901', 'services@govoffice.com', insertedUsers[0].id,
        '{"open": "10:00", "close": "16:00", "days": ["Mon","Tue","Wed","Thu","Fri"]}',
      ],
      [
        'National Bank Branch', 'bank',
        'Full-service banking branch offering personal banking, loans, investments, and business banking solutions.',
        '321 Finance Avenue, Indiranagar', 'Bangalore', 'Karnataka',
        '+91 80 5678 9012', 'support@nationalbank.com', insertedUsers[0].id,
        '{"open": "09:30", "close": "15:30", "days": ["Mon","Tue","Wed","Thu","Fri"]}',
      ],
      [
        'Sunrise Medical Center', 'hospital',
        'Advanced medical center specializing in cardiology, orthopedics, and neurology with 24/7 emergency services.',
        '555 Healthcare Blvd, Whitefield', 'Bangalore', 'Karnataka',
        '+91 80 6789 0123', 'info@sunrisemedical.com', insertedUsers[1].id,
        '{"open": "00:00", "close": "23:59", "days": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}',
      ],
    ];

    const insertedLocations = [];
    for (const row of locationRows) {
      const result = await client.query(
        `INSERT INTO locations (name, type, description, address, city, state, phone, email, admin_id, operating_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name`,
        row
      );
      insertedLocations.push(result.rows[0]);
    }
    console.log(`  Created ${insertedLocations.length} locations`);

    const queueRows = [
      [insertedLocations[0].id, hospitalOrgId, 'General OPD', 'General outpatient department for consultations', 'G', 15, 8, 10, 'active', 100],
      [insertedLocations[0].id, hospitalOrgId, 'Emergency', 'Emergency department - priority cases', 'E', 5, 3, 15, 'active', 50],
      [insertedLocations[0].id, hospitalOrgId, 'Pharmacy', 'Medicine dispensary counter', 'P', 20, 16, 3, 'active', 200],
      [insertedLocations[0].id, hospitalOrgId, 'Lab Tests', 'Blood tests and diagnostics', 'L', 12, 9, 8, 'active', 80],
      [insertedLocations[1].id, healthOrgId, 'General Consultation', 'Walk-in doctor consultations', 'C', 8, 5, 12, 'active', 50],
      [insertedLocations[1].id, healthOrgId, 'Dental Care', 'Dental checkup and procedures', 'D', 6, 4, 20, 'active', 30],
      [insertedLocations[2].id, govOrgId, 'Document Verification', 'Document submission and verification', 'V', 25, 18, 7, 'active', 150],
      [insertedLocations[2].id, govOrgId, 'Certificate Collection', 'Collect processed certificates', 'R', 10, 7, 5, 'active', 100],
      [insertedLocations[3].id, defaultOrgId, 'Account Services', 'Account opening, closing, and modifications', 'A', 8, 5, 15, 'active', 40],
      [insertedLocations[3].id, defaultOrgId, 'Loan Department', 'Loan applications and inquiries', 'LN', 5, 3, 20, 'active', 30],
      [insertedLocations[4].id, hospitalOrgId, 'Cardiology OPD', 'Heart specialist consultations', 'H', 0, 0, 15, 'pending', 40],
      [insertedLocations[4].id, healthOrgId, 'Orthopedics OPD', 'Bone and joint specialist', 'O', 0, 0, 12, 'pending', 40],
      [insertedLocations[1].id, healthOrgId, 'Skin Care', 'Dermatology appointments', 'SK', 0, 0, 15, 'inactive', 25],
    ];

    const insertedQueues = [];
    for (const row of queueRows) {
      const result = await client.query(
        `INSERT INTO queues (location_id, organization_id, name, description, prefix, current_number, now_serving, avg_service_time, status, max_capacity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name, status`,
        row
      );
      insertedQueues.push(result.rows[0]);
    }
    console.log(`  Created ${insertedQueues.length} queues (${insertedQueues.filter((queue) => queue.status === 'active').length} active, ${insertedQueues.filter((queue) => queue.status === 'pending').length} pending, ${insertedQueues.filter((queue) => queue.status === 'inactive').length} inactive)`);

    let tokenCount = 0;
    for (let i = 1; i <= 15; i++) {
      const status = i <= 7 ? 'completed' : (i === 8 ? 'serving' : 'waiting');
      const userId = insertedUsers[((i - 1) % 6) + 2].id;
      const bookedAt = new Date(Date.now() - (16 - i) * 12 * 60000).toISOString();
      const calledAt = status !== 'waiting' ? new Date(Date.now() - (15 - i) * 10 * 60000).toISOString() : null;
      const completedAt = status === 'completed' ? new Date(Date.now() - (15 - i) * 10 * 60000 + 8 * 60000).toISOString() : null;

      await client.query(
        `INSERT INTO tokens (token_number, queue_id, user_id, status, position, priority_level, booked_at, called_at, completed_at, estimated_wait)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          `G${String(i).padStart(3, '0')}`,
          insertedQueues[0].id,
          userId,
          status,
          i,
          i === 2 ? 'priority' : 'normal',
          bookedAt,
          calledAt,
          completedAt,
          status === 'waiting' ? (i - 8) * 10 : 0,
        ]
      );
      tokenCount++;
    }

    for (const queue of insertedQueues.filter((item) => item.status === 'active').slice(1, 6)) {
      for (let i = 1; i <= 5; i++) {
        const status = i <= 2 ? 'completed' : (i === 3 ? 'serving' : 'waiting');
        const userId = insertedUsers[((i - 1) % 6) + 2].id;
        const bookedAt = new Date(Date.now() - (6 - i) * 15 * 60000).toISOString();

        await client.query(
          `INSERT INTO tokens (token_number, queue_id, user_id, status, position, priority_level, booked_at, estimated_wait)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `${queue.name.charAt(0)}${String(i).padStart(3, '0')}`,
            queue.id,
            userId,
            status,
            i,
            'normal',
            bookedAt,
            status === 'waiting' ? (i - 3) * 8 : 0,
          ]
        );
        tokenCount++;
      }
    }
    console.log(`  Created ${tokenCount} tokens`);

    const notificationRows = [
      [insertedUsers[2].id, 'Token Booked', 'Your token G009 has been booked for General OPD at City General Hospital.', 'success', true],
      [insertedUsers[2].id, 'Queue Update', 'You are now at position 2 in the General OPD queue. Estimated wait: 20 minutes.', 'queue_update', true],
      [insertedUsers[2].id, 'Turn Approaching', 'Your turn is approaching! You are next in line at General OPD.', 'turn_approaching', false],
      [insertedUsers[3].id, 'Token Booked', 'Your token G010 has been booked for General OPD at City General Hospital.', 'success', true],
      [insertedUsers[4].id, 'Token Booked', 'Your token C004 has been booked for General Consultation at HealthFirst Clinic.', 'success', false],
    ];

    for (const row of notificationRows) {
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read)
         VALUES ($1, $2, $3, $4, $5)`,
        row
      );
    }
    console.log('  Created sample notifications');

    await client.query('COMMIT');

    console.log('\nDatabase seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin:    admin@smartqueue.com / password123');
    console.log('  User:     john@example.com / password123');
    console.log('  Provider: hospital@provider.com / password123');
    console.log('  Provider: healthfirst@provider.com / password123');
    console.log('  Provider: govserv@provider.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\nSeeding failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(async () => {
      await pool.end();
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  seed,
};
