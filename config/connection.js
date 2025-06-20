
const { MongoClient } = require('mongodb');

const state = {
    db: null
}

module.exports.connect = function(done) {
    const url = 'mongodb://localhost:27017';
    const dbname = 'shopping';
    
    MongoClient.connect(url, { useUnifiedTopology: true })
        .then((client) => {
            state.db = client.db(dbname);
            console.log("Database connected successfully");
            done();
        })
        .catch((err) => {
            console.log("Database connection failed:", err);
            done(err);
        });
}

module.exports.get = function() {
    return state.db;
}