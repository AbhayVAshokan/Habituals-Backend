const Sequelize = require('sequelize')

const nudgeSchema = {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    type: {
        type: Sequelize.STRING,
        notNull: true,
    },
    title: {
        type: Sequelize.STRING,
        notNull: true,
    },
    status: {
        type: Sequelize.STRING,
        notNull: true,
    },
    date: {
        type: Sequelize.DATE,
        default: Date.now
    },
    nudgeBooster: Sequelize.TEXT,
}

module.exports = nudgeSchema