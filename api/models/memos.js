// Memo Schema

const Sequelize = require('sequelize')

const memoSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    title: {
        type: Sequelize.STRING,
        required: true,
    },
    date: {
        type: Sequelize.DATE,
        default: Date.now,
    },
    data: Sequelize.TEXT,
}

module.exports = memoSchema