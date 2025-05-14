const router = require('express').Router();
const pool = require('../db/pool');
const format = require('pg-format');
require('dotenv').config();

const cronToMMDD = (cron) => {
  const [minute, hour, day, month] = cron.split(" ");

  // If day or month is wildcard (*), treat it as recurring
  const mm = month === "*" ? "Every Month" : month.padStart(2, "0");
  const dd = day === "*" ? "Every Day" : day.padStart(2, "0");

  return month === "*" ? `Recurring on Day ${dd} each Month` : `${mm}/${dd}`;
}

router.post('/schedule-job', async (req, res) => {
    const { acc_id, amount, label, cron } = req.body;
    try {
        const sanitizedLabel = label.replace(/[^a-z0-9_-]/gi, '');
        const newAmount = Number(amount);
        const aid = Number(acc_id);
        const jobName = `${sanitizedLabel}-${aid}-${Date.now()}`;
        const day = cronToMMDD(cron);
        const sql = format(`
            INSERT INTO transactions (name, price, account_id) VALUES (%L, %L, %L);
            UPDATE accounts SET balance = balance + %L WHERE id = %L
        `, sanitizedLabel, newAmount, aid, amount, aid);

        const result = await pool.query(`SELECT cron.schedule($1, $2, $$ ${sql} $$);`, [jobName, cron]);
        await pool.query('INSERT INTO schedules (description, jobname, amount, day, account_id) VALUES ($1, $2, $3, $4, $5);', [sanitizedLabel, jobName, newAmount, day, acc_id]);
        res.json({ jobId: result.rows[0].schedule });
    } catch(err) {
        console.error(err);
        res.status(500).json('Issue adding new job');
    }
});

router.post('/removeJobs', async (req, res) => {
    const { id, jobname } = req.body;
    try {
        await pool.query(`SELECT cron.unschedule($1);`, [jobname])
        .then(async () => {
            await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
            res.json('Job removed');
        });
    } catch(err) {
        res.status(500).json('Issue removing job');
    }
});

router.get('/getJobs', async (req, res) => {
    const { acc_id } = req.query;
    try {
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
