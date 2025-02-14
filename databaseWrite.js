const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fs = require("fs");
const csv = require("csv-parser");

require("dotenv").config();

const url = process.env.MONGO_URL;

const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db("sampleDatabase").collection("testDatabaseWrite");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function insertDocument(collection, document) {
  try {
    const insertResult = await collection.insertOne(mapColumnsNames(document));
    console.log("Document inserted successfully!", insertResult.insertedId);
  } catch (error) {
    console.error("Error inserting document:", error);
  } 
}

function mapColumnsNames(document){
  var res = {};

  const nameMapping = {
    "Write your first and last name or leave it blank if you'd like to stay anonymous!": "senderName",
    "Who are we sending this gift to? (Recipient’s name)": "receiverName",
    "Recipient’s email address": "receiverEmail",
    "Would you like to add a message? (optional)": "note",
    "Choose an option for your card!": "cardNumber",
    "Would you like to add roses and a chocolate gift package for $5?": "giftPackage"
  } 

  const cardOptionMapping = { 
    "Option 1": "4", 
    "Option 2": "3",
    "Option 3": "2",
    "Option 4": "1",
  }

  for (const key in document) {
    if (key in nameMapping) {
      
      if (key === "Choose an option for your card!"){
        const convertedOption = cardOptionMapping[document[key]];
        res[nameMapping[key]] = convertedOption;
      }
      else res[nameMapping[key]] = document[key];
    } else res[key] = document[key];
  }

  return res;
}

const main = async () => {
  console.log("This ran main");
  // Connecting to MongoDB
  const collection = await connectToDatabase();

  // Reading spreadsheet
  const results = await new Promise((resolve, reject) => {
    const data = [];

    fs.createReadStream("./data/form_test.csv")
      .pipe(csv())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
  
  for (const row of results){
    await insertDocument(collection, row);
  }

  await client.close();
}

main();
