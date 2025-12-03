// MongoDB initialization script
db = db.getSiblingDB('gamified_productivity');

// Create collections
db.createCollection('users');
db.createCollection('calendar_events');
db.createCollection('action_steps');
db.createCollection('assessments');
db.createCollection('avatars');
db.createCollection('xp_records');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "user_id": 1 }, { unique: true });

db.calendar_events.createIndex({ "user_id": 1, "start_time": 1 });
db.calendar_events.createIndex({ "event_id": 1 }, { unique: true });

db.action_steps.createIndex({ "user_id": 1, "due_date": 1 });
db.action_steps.createIndex({ "life_pillar": 1 });

db.assessments.createIndex({ "user_id": 1, "completed_date": -1 });

db.avatars.createIndex({ "user_id": 1 }, { unique: true });

db.xp_records.createIndex({ "user_id": 1, "life_pillar": 1 });
db.xp_records.createIndex({ "created_at": -1 });

print('Database initialized successfully!');