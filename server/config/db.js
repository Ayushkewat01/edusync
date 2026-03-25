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

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log(`✅ In-Memory MongoDB Connected`);
    console.log(`   ⚠️  Data will be lost when server restarts`);
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
