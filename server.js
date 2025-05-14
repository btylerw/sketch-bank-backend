const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const userRouter = require('./routes/user');
const transactionRouter = require('./routes/transactions');
const scheduleRouter = require('./routes/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setting up the different routes
// userRouter will relate to user data
app.use('/users', userRouter);
// transactionRouter will relate to transactional data
app.use('/transactions', transactionRouter);
// scheduleRouter will aid in creating or deleting different cron jobs
app.use('/schedule', scheduleRouter);
// Server is now listening
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
