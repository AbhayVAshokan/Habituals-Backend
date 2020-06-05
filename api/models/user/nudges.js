const Sequelize = require('sequelize')

const nudgeSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    type: {
        type: Sequelize.STRING,
        required: true,
    },
    title: {
        type: Sequelize.STRING,
        required: true,
    },
    status: {
        type: Sequelize.STRING,
        required: true,
    },
    date: {
        type: Sequelize.DATE,
        default: Date.now
    },
    nudgeBooster: Sequelize.TEXT,
}

module.exports = nudgeSchema