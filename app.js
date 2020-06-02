const morgan = require('morgan')
const express = require('express')
const Sequelize = require('sequelize')
const keys = require('./resources/keys')
const userSchema = require('./api/models/user')
const memoSchema = require('./api/models/memos')
const nudgeSchema = require('./api/models/nudges')
const userRoute = require('./api/routes/userRoute')
const credentials = require('./resources/credentials')

const app = express();

const connection = new Sequelize(keys.databaseName, credentials.userName, credentials.userPassword, {
    host: keys.baseUrl,
    dialect: 'mysql',
});
connection.define('users', userSchema)
connection.define('memos', memoSchema)
connection.define('nudges', nudgeSchema)
connection.sync()
    .then(() => {
        console.log("\x1b[32m", '\nDatabase Connection: SUCCESSFUL\n')
    })
    .catch((err) => {
        console.log(err)
        console.log("\x1b[31m", `\nManually create the database: ${keys.databaseName}\n`)
    });


// Handling CORS errors
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({
            message: "request granted",
        });
    }
    next();
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoute)

app.use((req, res, next) => {
    const error = Error('404 Page not found');
    error.status(404);
    next(error);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: false,
        message: '404 route not found',
    })
});

module.exports = app;