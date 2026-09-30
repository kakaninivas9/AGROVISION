const mongoose = require('mongoose');

async function migrate() {
  const uri = 'mongodb://localhost:27017/cropguard_pro';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('users');

  const users = await collection.find({ fullName: { $exists: true } }).toArray();
  console.log(`Found ${users.length} users with fullName field.`);

  for (const user of users) {
    if (!user.name) {
      await collection.updateOne(
        { _id: user._id },
        { 
          $set: { name: user.fullName },
          $unset: { fullName: "" } 
        }
      );
      console.log(`Migrated user: ${user.fullName} -> ${user.email}`);
    }
  }
  
  console.log('Migration complete.');
  process.exit(0);
}

migrate();
