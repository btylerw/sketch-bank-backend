const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
require('dotenv').config();

const updateBalance = async (balance, amount, acc_id) => {
    const numBalance = Number(balance);
    const newBalance = numBalance + amount;
    await pool.query("UPDATE accounts SET balance = $1 WHERE id = $2", [newBalance, acc_id]);
}

const insertTransaction = async (acc_id, transName, transPrice, transDate, balance) => {
    await pool.query("INSERT INTO transactions (name, price, date, account_id) VALUES ($1, $2, $3, $4);", [transName, transPrice, transDate, acc_id])
    .then(async () => {
        await updateBalance(balance, transPrice, acc_id);
    })
}

router.post('/addTransaction', async (req, res) => {
    try {
        const { acc_id, transName, transPrice, transDate, balance } = req.body;
        await insertTransaction(acc_id, transName, transPrice, transDate, balance)
        .then(() => {
            res.status(200).json('Transaction successfully added');
        })
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Issue adding transaction'});
    }
});

router.get('/getTransactions', async (req, res) => {
    try {
        const { acc_id } = req.query;
        await pool.query("SELECT id, date, name, price FROM transactions WHERE account_id = $1;", [acc_id])
        .then(response => {
            const rows = response.rows;
            res.json(rows);
        })
    } catch(err) {
        console.error(err);
    }
});

router.post('/transferFunds', async (req, res) => {
    try {
        const { sender_id, receiver_id, amount, balance } = req.body;
        const receiverBalance = await pool.query("SELECT balance FROM accounts WHERE id = $1", [receiver_id]);
        const recBalance = Number(receiverBalance.rows[0].balance);
        const negAmount = -amount;
        // Creating new transactions for both accounts
        await insertTransaction(receiver_id, 'Wire Transfer', amount, new Date(), recBalance);
        await insertTransaction(sender_id, 'Wire Transfer', negAmount, new Date(), balance)
        .then(() => {
            res.status(200).json('Transfer successful'); 
        });
    } catch(err) {
        console.log(err);
        res.status(500).json('Issue transferring funds');
    }
});

module.exports = router;
