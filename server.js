// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create expense or update existing
app.post('/expenses', async (req, res) => {
    const { name, object_name, rupees } = req.body;

    try {
        // Check if name exists
        const checkResult = await pool.query(
            'SELECT id, rupees FROM expenses WHERE name = $1',
            [name]
        );

        let result;
        let isNew = false;

        if (checkResult.rows.length > 0) {
            // Update existing record
            const currentRupees = parseFloat(checkResult.rows[0].rupees);
            const newRupees = currentRupees + rupees;

            // Get current objects
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
            // Insert new record
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
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

// Get total for a name
app.get('/expenses/:name/total', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT rupees FROM expenses WHERE name = $1',
            [req.params.name]
        );

        if (result.rows.length > 0) {
            res.json({ total: result.rows[0].rupees });
        } else {
            res.json({ total: 0 });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});