var promise = require('promise');
var mongoClient = require('mongodb').MongoClient;

var state =
{
    db: null
}
module.exports =
{
    Database_Connection: () => {
        return new promise((resolve, reject) => {
            mongoClient.connect('mongodb+srv://ticketsure:3CzrVf7tDjENrLqG@cluster0.e9bzj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true }, (err, data) => {
                var dbname = "Ticket_Validation"
                if (err) {
                    reject(err)
                }
                else {
                    state.db = data.db(dbname);
                    resolve("Databse Connection Successfull...")
                }
            })
        })
    },
    get: () => {
        return state.db;
    }
}

