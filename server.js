const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config({ path: '../.env' });
const cors = require('cors');
const userRouter = require('./routes/user');
const transactionRouter = require('./routes/transactions');
const scheduleRouter = require('./routes/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
	origin: '*',
	optionsSuccessStatus: 200
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	next();
})
app.use('/users', userRouter);
app.use('/transactions', transactionRouter);
app.use('/schedule', scheduleRouter);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
