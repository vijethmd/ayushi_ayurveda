const db = require('../config/db');

const addTimelineEvent = async (patientId, eventType, eventTitle, eventDescription, createdBy = null) => {
  try {
    await db.query(
      'INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by) VALUES (?,?,?,?,NOW(),?)',
      [patientId, eventType, eventTitle, eventDescription, createdBy]
    );
  } catch (err) {
    console.error('Timeline event failed:', err.message);
  }
};

module.exports = { addTimelineEvent };
