const router = require('express').Router();
const pool = require('../db/pool');

// Updates supplied account number's balance by a specified amount
const updateBalance = async (amount, acc_id) => {
    await pool.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, acc_id]);
}

// Creates a new transaction and updates that accounts balance accordingly
const insertTransaction = async (acc_id, transName, transPrice, transDate) => {
    await pool.query("INSERT INTO transactions (name, price, date, account_id) VALUES ($1, $2, $3, $4);", [transName, transPrice, transDate, acc_id])
    .then(async () => {
        await updateBalance(transPrice, acc_id);
    })
}

// Endpoint that will call insertTransaction to create a new transaction entry
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

// Endpoint that retrieves all of the transactional data and sends it to the user
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

// Endpoint that calls insertTransaction for both the receiver and sender
// Removing the specified amount of funds from the sender's account
// And adding the same amount to the receiver's fund
// This will create new transactions for both accounts
router.post('/transferFunds', async (req, res) => {
    try {
        const { sender_id, receiver_id, amount, balance } = req.body;
        const negAmount = -amount;
        // Creating new transactions for both accounts
        await insertTransaction(receiver_id, 'Wire Transfer', amount, new Date());
        await insertTransaction(sender_id, 'Wire Transfer', negAmount, new Date())
        .then(() => {
            res.status(200).json('Transfer successful'); 
        });
    } catch(err) {
        res.status(500).json('Issue transferring funds');
    }
});

module.exports = router;
