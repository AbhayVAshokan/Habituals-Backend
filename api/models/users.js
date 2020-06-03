// User model

const Sequelize = require('sequelize')

const userSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    emailAddress: {
        type: Sequelize.STRING,
        required: true,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        required: true,
    },
    mailingList: {
        type: Sequelize.BOOLEAN,
        default: true,
    },

    age: Sequelize.INTEGER,
    gender: Sequelize.STRING,
    position: Sequelize.STRING,
}

module.exports = userSchema;