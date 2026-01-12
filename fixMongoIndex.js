require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function fixMongoIndex() {
  try {
    // Load environment variables
    const dbUri = process.env.DB_URI;
    console.log('Connecting to MongoDB Atlas...');
    console.log('DB URI:', dbUri ? 'Found' : 'Not found in .env');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB Atlas');

    // Get the Order collection
    const db = mongoose.connection.db;
    const collection = db.collection('orders');

    // List current indexes first
    console.log('📋 Current indexes before fix:');
    const existingIndexes = await collection.listIndexes().toArray();
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
    });

    // Drop the existing razorpay_payment_id index if it exists
    try {
      await collection.dropIndex('razorpay_payment_id_1');
      console.log('✅ Dropped existing razorpay_payment_id_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index razorpay_payment_id_1 does not exist, skipping...');
      } else {
        console.log('❌ Error dropping index:', error.message);
      }
    }

    // Create the new sparse index
    await collection.createIndex(
      { razorpay_payment_id: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'razorpay_payment_id_sparse_1'
      }
    );
    console.log('✅ Created new sparse razorpay_payment_id index');

    // List all indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes after fix:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
    });

    console.log('🎉 MongoDB index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing MongoDB index:', error);
    console.error('Full error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixMongoIndex();
