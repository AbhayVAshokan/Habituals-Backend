const uuid = require('uuid')
const realtime = require('../../resources/realtime_data') 

module.exports = {
    // A function which is executed during the user registration. It populates the nudge table with all the nudges to be done by the user in the 66 days of well-being.
    getNudges: (user) => {
        console.log(user)
         // Retrieve all general nudges
         realtime.AdminNudge.findAll()
         .then((allNudges) => {
             allNudges.map((_nudge) => {

                 // To add days to a date
                 Date.prototype.addDays = function (days) {
                     var date = new Date(this.valueOf());
                     date.setDate(date.getDate() + days);
                     return date;
                 }

                 // Populate the user nudges from the admin nudges
                 for (var i = 0; i < 66; i++) {
                     realtime.Nudge.create({
                         id: uuid.v4(),
                         userId: user.id,
                         nudgeId: _nudge.id,
                         status: 'not completed',
                         date: user.dataValues.startDate.addDays(i)
                     })
                 }
             })
         })
    },
}