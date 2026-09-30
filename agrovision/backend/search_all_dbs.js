const mongoose = require('mongoose');

async function listDbs() {
  const uri = 'mongodb://localhost:27017';
  await mongoose.connect(uri);
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log("Databases Found:", dbs.databases.map(d => d.name));
  
  for (const info of dbs.databases) {
    const dbName = info.name;
    if (['admin', 'config', 'local'].includes(dbName)) continue;
    
    const db = mongoose.connection.useDb(dbName);
    const collections = await db.db.listCollections().toArray();
    for (const coll of collections) {
      if (coll.name === 'users') {
        const users = await db.db.collection('users').find({}).toArray();
        if (users.length > 0) {
          console.log(`\n--- DB: ${dbName} | Collection: users ---`);
          users.forEach(u => console.log(`- ${u.email || u.username} (${u.name || u.fullName || 'No Name'})`));
        }
      }
    }
  }
  process.exit(0);
}

listDbs();
