const cozy = require('../cozyclient');
const DOCTYPE = 'io.cozy.events';

module.exports = {
  displayName: 'Event',
  doctype: DOCTYPE,
  all (callback) {
    cozy.data.defineIndex(DOCTYPE, [])
    .then((index) => {
      return cozy.data.query(index, {});
    })
    .then((events) => {
      callback(null, events);
    })
    .catch((err) => {
      callback(err);
    });
  },

  byCalendar (calendarId, callback) {
    cozy.data.find(DOCTYPE, calendarId)
    .then((event) => {
      callback(null, event);
    })
    .catch((err) => {
      callback(err);
    });
  },

  getInRange (options, callback) {
    cozy.data.defineIndex(DOCTYPE, ['date'])
    .then((index) => {
      return cozy.data.query(index, {'selector': {date: {'$gt': options.start, '$lt': options.end}}});
    })
    .then((events) => {
      callback(null, events);
    })
    .catch((err) => {
      callback(err);
    });
  },

  createOrUpdate (data, callback) {
    let {id} = data;
    data.caldavuri = id;
    data.docType = DOCTYPE;
    delete data._id;
    delete data._attachments;
    delete data._rev;
    delete data.binaries;
    delete data.id;

    this.byCalendar(id, (err, events) => {
      if(!err && data.caldavuri === events[0].caldavuri) {
        let event = events[0];

        data.place |= null;
        event.place |= null;
        data.description |= null;
        event.description |= null;
        data.detail |= null;
        event.detail |= null;

        // Only update attributes that should not be changed by the user
        if (data.start !== event.start || data.end !== event.end
          || data.place !== event.place || data.description !== event.description
          || data.details !== event.details) {
          // clone object
          oldValue = event.toJSON();
          cozy.data.updateAttributes(DOCTYPE, event._id, data)
          .catch((err) => callback(err))
          .then((event) => callback(null, event, {creation: false, update: true}));
        }  else {
          callback(null, event, {creation: false, update: true});
        }
      } else {
        cozy.data.create(DOCTYPE, data)
        .catch((err) => callback(err))
        .then((event) => callback(null, event, {creation: true, update: false}));
      }
    });
  }
}
