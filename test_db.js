const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    const tasks = await db.collection('tasks').find({}).toArray();
    console.log('Users:');
    users.forEach(u => console.log(`  - ${u.name} (id: ${u._id}, role: ${u.role})`));
    console.log('Tasks:');
    tasks.forEach(t => console.log(`  - ${t.title} [createdBy: ${t.createdBy}, assignedTo: ${t.assignedTo}]`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
