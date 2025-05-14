const router = require('express').Router();
const pool = require('../db/pool');
const format = require('pg-format');

// Converts cron code into a string to tell the user how often a scheduled payment will come through
const cronToMMDD = (cron) => {
    const [minute, hour, day, month] = cron.split(" ");
    const dd = day === "*" ? "Every Day" : day.padStart(2, "0");

    return `Recurring on Day ${dd} each Month`;
}

// Creates a new cron job
router.post('/schedule-job', async (req, res) => {
    const { acc_id, amount, label, cron } = req.body;
    try {
        // Cleans the label to prevent SQL injection
        const sanitizedLabel = label.replace(/[^a-z0-9_-]/gi, '');
        // Ensuring some of the values we use are of the correct type
        const newAmount = Number(amount);
        const aid = Number(acc_id);
        // jobName will always be unique by ending with current timestamp
        const jobName = `${sanitizedLabel}-${aid}-${Date.now()}`;
        const day = cronToMMDD(cron);
        // This will be the query the job performs at the specified time interval (once a month)
        // Only allows a user to create a new transaction and change their account balance accordingly
        // Using format() from pg-format to bind passed in data to the query and prevent SQL injection
        const sql = format(`
            INSERT INTO transactions (name, price, account_id) VALUES (%L, %L, %L);
            UPDATE accounts SET balance = balance + %L WHERE id = %L
        `, sanitizedLabel, newAmount, aid, amount, aid);
        // Create the new job
        const result = await pool.query(`SELECT cron.schedule($1, $2, $$ ${sql} $$);`, [jobName, cron]);
        // Creating an entry into the schedules table, which acts as a reference for the use to see and interact with
        // all of the active cron jobs that are performing actions for their account
        // Saving the jobName to a reference table allows the job to easily be unscheduled
        await pool.query('INSERT INTO schedules (description, jobname, amount, day, account_id) VALUES ($1, $2, $3, $4, $5);', [sanitizedLabel, jobName, newAmount, day, acc_id]);
        res.json({ jobId: result.rows[0].schedule });
    } catch(err) {
        console.error(err);
        res.status(500).json('Issue adding new job');
    }
});

// Deletes an active job
router.post('/removeJobs', async (req, res) => {
    const { id, jobname } = req.body;
    try {
        // Deletes an active job if that jobname exists
        await pool.query(`SELECT cron.unschedule($1);`, [jobname])
        .then(async () => {
            // Once a job is successfully delete, we remove the corresponding entry in the schedules reference table
            await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
            res.json('Job removed');
        });
    } catch(err) {
        res.status(500).json('Issue removing job');
    }
});

// Retrieves all job information relating to a user from the schedules table
router.get('/getJobs', async (req, res) => {
    const { acc_id } = req.query;
    try {
        // jobname is being sent to the user to allow specific job deletion
        await pool.query('SELECT id, description, amount, day, jobname FROM schedules WHERE account_id = $1', [acc_id])
        .then(response => {
            const rows = response;
            res.json(rows);
        })
    } catch(err) {
        console.error(err);
        res.status(500).json('Issue getting jobs');
    }
});

module.exports = router;
