const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "https://valentinefe-9yfv5.ondigitalocean.app",
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

let collection;

async function connectToDatabase() {
  if (!collection) {
    try {
      await client.connect();
      console.log("Connected to MongoDB!");
      collection = client.db("sampleDatabase").collection("testDatabaseWrite");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }
  return collection;
}

app.get("/api/documents", async (req, res) => {
  try {
    const collection = await connectToDatabase();
    let query = { ...req.query };

    if (query._id) {
      try {
        query._id = new ObjectId(query._id);
      } catch (error) {
        console.error("Invalid _id format:", error);
        return res.status(400).json({ error: "Invalid _id format" });
      }
    }

    console.log("Querying documents with:", query);
    const documents = await collection.find(query).toArray();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
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

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
