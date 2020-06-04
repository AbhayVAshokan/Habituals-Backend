const http = require('http')
const morgan = require('morgan')
const express = require('express')
const Sequelize = require('sequelize')
const keys = require('./resources/keys')
const userRoutes = require('./api/routes/users')
const userSchema = require('./api/models/users')
const memoSchema = require('./api/models/memos')
const adminRoutes = require('./api/routes/admin')
const nudgeSchema = require('./api/models/nudges')
const querySchema = require('./api/models/queries')
const credentials = require('./resources/credentials')
const realtime = require('./resources/realtime_data.js')

const app = express()
var db = {}

// Handling CORS
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

// Connecting to MySQL server
const connection = new Sequelize(keys.databaseName, credentials.userName, credentials.userPassword, {
    host: keys.baseUrl,
    dialect: 'mysql',
})

// Defining tables
const User = connection.define('users', userSchema)
const Memo = connection.define('memos', memoSchema)
const Nudge = connection.define('nudges', nudgeSchema)
const Query = connection.define('queries', querySchema)

// Updating the realtime data to the table variables
realtime.User = User
realtime.Memo = Memo
realtime.Nudge = Nudge
realtime.Query = Query

// Updating tables
connection.sync()
    .then(() => {
        console.log("\x1b[32m", '\nDatabase Connection: SUCCESSFUL\n')
        console.log("\x1b[37m", '')
    })
    .catch((err) => {
        console.log("\x1b[31m", err.message)
        console.log("\x1b[31m", `Manually create the database: ${keys.databaseName}\n`)
        console.log("\x1b[37m", '')
    });

// Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/user', userRoutes)
app.use('/admin', adminRoutes)

// Throw 404 error if the request does not match an existing route
app.use((req, res, next) => {
    const error = new Error()
    error.status = 404
    error.message = '404 route not found'
    next(error)
})

//  Return the error thrown by any part of the project.
app.use((err, req, res, next) => {
    res.status(err.status || 404).json({
        status: false,
        error: err.message,
    })
});

// Running the server on the given port
const port = process.env.PORT || keys.port
const server = http.createServer(app)
server.listen(port, () => {
    console.log("\x1b[33m", `\nServer running on port: ${port}`)
    console.log("\x1b[37m", '')
})