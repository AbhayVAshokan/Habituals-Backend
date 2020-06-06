const uuid = require('uuid')
const realtime = require('../../resources/realtime_data')

module.exports = {
    addNudges: (nudgeId) => {
        // To add days to a date
        Date.prototype.addDays = function (days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }

        realtime.User.findAll()
        .then((users) => {
            for(var i=0; i<users.length; i++) {
                console.log(users[i].dataValues)
                console.log('---------------------')
                for(var j=0; j<66; j++) {
                    realtime.Nudge.create({
                        id: uuid.v4(),
                        userId: users[i].dataValues.id,
                        nudgeId: nudgeId.id,
                        status: 'not completed',
                        date: users[i].dataValues.startDate.addDays(j)
                    })
                }   
            }
        })
    }
}