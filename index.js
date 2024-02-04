import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import databaseClient from "./database.mjs";
import { ObjectId } from "mongodb";
import { checkMissingFields } from "./checkMissingFields.js";

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,DELETE,PUT",
  allowedHeaders: "Content-Type,Authorization",
};

const HOSTNAME = process.env.SERVER_IP;
const PORT = process.env.SERVER_PORT;
dotenv.config();

const webServer = express();
webServer.use(cors());
webServer.use(express.json());

const requiredFields = ["activityType", "hourGoal", "minuteGoal", "date"];

webServer.get("/activityInfo", async (req, res) => {
  const activityInfo = await databaseClient
    .db()
    .collection("activityInfo")
    .find({})
    .toArray();
  res.json(activityInfo);
});

webServer.post("/activityInfo", async (req, res) => {
  const newActivityItem = req.body;
  const missingFields = await checkMissingFields(
    newActivityItem,
    requiredFields
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Validation failed. The following fields are missing values:",
      missingFields: missingFields,
    });
  }

  await databaseClient
    .db()
    .collection("activityInfo")
    .insertOne(newActivityItem);
  res.status(201).json({ message: "Activity info was added successfully" });
});

webServer.delete("/activityInfo/:id", async (req, res) => {
  const id = req.params.id;
  await databaseClient
    .db()
    .collection("activityInfo")
    .deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({ message: "This activity was deleted successfully" });
});

webServer.put("/activityInfo", async (req, res) => {
  console.log(req.body);
  const item = req.body;
  const id = req.body.id;

  const missingFields = await checkMissingFields(item, requiredFields);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Validation failed. The following fields are missing values:",
      missingFields: missingFields,
    });
  }

  const dataItem = await databaseClient
    .db()
    .collection("activityInfo")
    .findOne({ _id: new ObjectId(id) });
  console.log(dataItem);

  let updateItem = {};
  if (dataItem?.actualTime) {
    updateItem = { ...item, actualTime: dataItem.actualTime };
  } else {
    updateItem = item;
  }
  await databaseClient
    .db()
    .collection("activityInfo")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateItem });
  res.status(200).json({ message: "This activity was updated successfully" });
});

const currentServer = webServer.listen(PORT, HOSTNAME, () => {
  console.log(`SERVER IS ONLINE => http://${HOSTNAME}:${PORT}`);
  console.log(
    `DATABASE IS CONNECTED: NAME => ${databaseClient.db().databaseName}`
  );
});
