const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Basic root route for health check
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Render
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to database successfully');
        release();
    }
});

app.post('/expenses', async (req, res) => {
    try {
        const { name, object_name, rupees } = req.body;
        console.log('Received request:', { name, object_name, rupees });

        // Check if name exists
        const checkResult = await pool.query(
            'SELECT id, rupees FROM expenses WHERE name = $1',
            [name]
        );

        let result;
        let isNew = false;

        if (checkResult.rows.length > 0) {
            const currentRupees = parseFloat(checkResult.rows[0].rupees);
            const newRupees = currentRupees + rupees;

            const objResult = await pool.query(
                'SELECT object_names FROM expenses WHERE name = $1',
                [name]
            );
            const currentObjects = objResult.rows[0].object_names;
            const newObjects = currentObjects ? `${currentObjects}, ${object_name}` : object_name;

            result = await pool.query(
                'UPDATE expenses SET rupees = $1, object_names = $2 WHERE name = $3 RETURNING *',
                [newRupees, newObjects, name]
            );
        } else {
            result = await pool.query(
                'INSERT INTO expenses (name, object_names, rupees) VALUES ($1, $2, $3) RETURNING *',
                [name, object_name, rupees]
            );
            isNew = true;
        }

        res.json({
            success: true,
            isNew,
            totalRupees: result.rows[0].rupees
        });
    } catch (error) {
        console.error('Error in /expenses:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/expenses/:name/total', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT rupees FROM expenses WHERE name = $1',
            [req.params.name]
        );

        res.json({
            total: result.rows.length > 0 ? result.rows[0].rupees : 0
        });
    } catch (error) {
        console.error('Error in /expenses/total:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
