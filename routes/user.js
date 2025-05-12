const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
require('dotenv').config();

// Authenticates users
router.get('/login', async (req, res) => {
    try {
        // User passes in username and password
        const {username, password} = req.query
        // Searches db for username and retrieves password
        await pool.query("SELECT password FROM users WHERE username = $1;", [username])
        .then(response => {
            const rows = response.rows;
            if (rows[0].password) {
                // Password pulled from database
                const userPass = rows[0].password;
                // Compares entered password with password from database
                bcrypt.compare(password, userPass, async function(err, result) {
                    if (result) {
                        // if match, validated
                        // Retrieve user info and send it to user
                        await pool.query("SELECT users.id as user_id, users.fname, users.lname, accounts.id as acc_id, accounts.balance, users.username FROM accounts JOIN users ON accounts.user_id = users.id WHERE users.username = $1;", [username])
                        .then(response => {
                            const rows = response.rows;
                            res.json(rows);
                        })
                    } else {
                        // no match, don't validate
                        res.send();
                    }
                })
            }
        })
    } catch (err) {
        console.error(err);
        // There was an error, so we don't validate
        res.send();
    }
})

// Allows user to change the balance in their account
router.post('/changeBalance', async (req, res) => {
    const {acc_id, newBalance} = req.body;
    try {
        // Sets new balance in account with passed in account id
        await pool.query("UPDATE accounts SET balance = $1 WHERE acc_id = $2", [newBalance, acc_id])
        .then(response => {
            res.json('Balance Updated');
        })
    } catch(err) {
        console.error(err);
        res.json('Issue updating balance');
    }
});

router.get('/getBalance', async (req, res) => {
    const {acc_id} = req.query;
    try {
        await pool.query('SELECT balance FROM accounts WHERE id = $1', [acc_id])
        .then(response => {
            const rows = response.rows;
            res.json(rows);
        })
    } catch(err) {
        console.error(err);
    }
});

// Creates a new account
router.post('/signup', async (req, res) => {
    try {
        // passed in user data
        const {username, fname, lname, password, email} = req.body;
        // Checks to ensure username does not already exist
        await pool.query("SELECT username FROM users WHERE username = $1;", [username])
        .then(res => {
            if (res.rows[0]) {
                // Error we will be sending to User
                throw('Username already exists');
            }
        });
        // Checks to ensure email does not already exist
        await pool.query("SELECT email FROM users WHERE email = $1;", [email])
        .then(res => {
            if (res.rows[0]) {
                // Error we will be sending to User
                throw('Email already exists');
            }
        })
        // Begin hashing passed in password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error(`Error: ${err}`);
                return;
            }
            bcrypt.hash(password, salt, async(err, password) => {
                if (err) {
                    console.error(`Error: ${err}`);
                }
                try {
                    // User is entered into database
                    await pool.query("INSERT INTO users (username, password, email, fname, lname) VALUES ($1, $2, $3, $4, $5);", [username, password, email, fname, lname])
                    .then(async () => {
                        await pool.query("SELECT id FROM users WHERE username = $1", [username])
                        .then(async (response) => {
                            const rows = response.rows;
                            const id = rows[0].id;
                            // Creates accounts table for user
                            await pool.query("INSERT INTO accounts (user_id, balance) VALUES ($1, $2);", [id, 200]);
                        })
                    })
                    res.json('User "successfuly created"');
                }
                catch (err) {
                    console.error(`Error: ${err}`);
                    res.json('Issue creating user');
                }
            })
        })
        console.log('User created!');
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err});
    }
});
module.exports = router;
