const mongoose = require('mongoose');

async function connectDB() {
    const uri =  process.env.MONGO_URI;
    if(!uri) throw new console.error('Mongo uri is not defined.');
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('MngoDB connected');   
}

module.exports  = {connectDB};