const {MongoClient} = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);
let database;

const connectDB = async() => {
    try {
        await client.connect();
        database = client.db("eli5");
        console.log("Database connected successfully")
    } catch (error) {
        console.error("Failed to connect to database: ", error);
    }
}

const getDB = () => {
    if(!database){
        throw new Error("Databse not intialized. Call connectDB first.")
    }
    return database;
}

module.exports = {connectDB, getDB};