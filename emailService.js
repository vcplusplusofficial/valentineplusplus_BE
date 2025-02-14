const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

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

async function fetchAllDocuments() {
  try {
    const collection = await connectToDatabase();
    const documents = await collection.find({}).toArray(); // Fetch all documents
    return documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
  } finally {
    await client.close(); // Close connection after fetching
  }
}

async function sendEmail (transporter, document, template, receiver) {
  // Receiver emails
  const userEmail = document['receiverEmail'];
  const userName = document['receiverName'];
  const redirectLink = document['_id'];
  const packageBoolean = document['giftPackage'] === "Yes";
  const senderName = document['senderName'];

  // 1. Rendering template
  const htmlContent = 
    receiver ? 
      ejs.render(template, { recieverName: userName, redirectLink: redirectLink, packageBoolean: packageBoolean }) : // reciver
      ejs.render(template, { senderName: senderName, redirectLink: redirectLink, packageBoolean: packageBoolean }) // sender 
  ;

  // 3. Send Email with Rendered HTML
  const mailOptions = {
    from: 'VC++ <${process.env.EMAIL_USER}>',
    to: userEmail,
    subject: receiver ? "[Valentine's++] A Heartfelt Surprise Awaits You! 🌟💌" : "[Valentine's++] Your Valentine's++ Surprise is On Its Way! 🌹💌",
    html: htmlContent, // Rendered HTML from EJS
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent: " + info.response, "_id:", redirectLink, "reciever:", receiver);
}

const main = async () => {
  const documents = await fetchAllDocuments();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
  });

  const receiverTemplate = fs.readFileSync("./templates/receiverTemplate.ejs", "utf-8");
  const senderTemplate = fs.readFileSync("./templates/senderTemplate.ejs", "utf-8");


  for (const doc of documents){
    await sendEmail(transporter, doc, receiverTemplate, true);
    await sendEmail(transporter, doc, senderTemplate, false);
  }
}

main();