const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your React app's URL
  })
);
app.use(express.json());

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
    return client.db("sampleDatabase").collection("sampleCollection");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

app.get("/api/documents", async (req, res) => {
  try {
    const collection = await connectToDatabase();
    let query = { ...req.query }; // Clone query parameters

    // Convert `_id` to ObjectId if it exists in the query
    if (query._id) {
      try {
        query._id = new ObjectId(query._id);
      } catch (error) {
        return res.status(400).json({ error: "Invalid _id format" });
      }
    }

    const documents = await collection.find(query).toArray();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/documents", async (req, res) => {
  try {
    const collection = await connectToDatabase();
    const document = req.body; // Get the document to insert from the request body

    // Insert the document into the collection
    const insertResult = await collection.insertOne(document);

    res.status(201).json({
      message: "Document inserted successfully!",
      insertedId: insertResult.insertedId,
    });
  } catch (error) {
    console.error("Error inserting document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
