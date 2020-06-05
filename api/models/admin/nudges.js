// Model to represent admin's access to addition and deletion of nudges.

const Sequelize = require('sequelize')

const adminNudgeSchema = {
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
    nudgeBooster: Sequelize.TEXT,
}

module.exports = adminNudgeSchema