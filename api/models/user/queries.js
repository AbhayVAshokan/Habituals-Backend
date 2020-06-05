// Table to store the submissions of the initial set of questions answered by the user.

const Sequelize = require('sequelize')

const querySchema = {
    userId: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    startDate: {
        type: Sequelize.DATE,
        default: Date()
    },

    generalQuery: {
        type: Sequelize.TINYINT,
        default: 2.5,
    },
    bodyQuery: Sequelize.JSON,
    mindQuery: Sequelize.JSON,
    achievementQuery: Sequelize.JSON,
    relationshipQuery: Sequelize.JSON,
    personalDevelopmentQuery: Sequelize.JSON,
}

module.exports = querySchema