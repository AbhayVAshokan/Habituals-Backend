// These nudges are created by the user

const Sequelize = require('sequelize')

const customNudgeSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    type: {
        type: Sequelize.STRING,
        default: 'custom'
    },
    title: {
        type: Sequelize.STRING,
        required: true,
    },
    nudgeBooster: Sequelize.TEXT,
}

module.exports = customNudgeSchema