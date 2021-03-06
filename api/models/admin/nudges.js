// This is the table where all the nudges, nudgeBoosters and their corresponding types are stored. These can be created, deleted or modified only by the admin.

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