// Update the pool configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rbkbot_user:AI3v0r77zt2AHAREVrg5XyT5YPtCMQV0@dpg-cts1iht2ng1s73btlqt0-a/rbkbot
    ssl: {
        rejectUnauthorized: false
    }
});

// Add connection error logging
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test the connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Successfully connected to database');
        done();
    }
});
