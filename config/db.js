const mongoose = require('mongoose');
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {});
  
      console.log(`mongodb connection successful`);
    } catch (error) {
        console.log("error",error)
      console.error(`mongodb connection failed`);
      process.exit(1); 
    }
  };
  
  module.exports = connectDB;