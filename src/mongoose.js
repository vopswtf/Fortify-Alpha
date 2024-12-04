const mongoose = require('mongoose');

module.exports = (app) => {
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.MONGO_URI);
}
