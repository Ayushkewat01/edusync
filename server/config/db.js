const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  // Try external MongoDB first with a short timeout
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusync';
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    return;
  } catch (error) {
    console.log(`⚠️  Cannot connect to ${uri} (${error.message})`);
    console.log('   Falling back to in-memory database...');
  }

  // Fallback to embedded MongoDB with persistence
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const path = require('path');
    const fs = require('fs');
    
    const dbPath = path.join(__dirname, '../../local-mongo-data');
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

    mongoServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' }
    });
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log(`✅ Local Embedded MongoDB Connected`);
    console.log(`   💾 Data safely persisting to ./local-mongo-data`);
  } catch (memError) {
    console.error('❌ Failed to start in-memory MongoDB:', memError.message);
    process.exit(1);
  }
};

// Cleanup on exit
const cleanup = async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = connectDB;
