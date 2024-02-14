import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import databaseClient from "./database.mjs";
import { ObjectId } from "mongodb";
import { checkMissingFields } from "./checkMissingFields.js";
import bcrypt from "bcrypt";
import setTZ from "set-tz";
import { getISOWeek } from "date-fns";
import jwt from "jsonwebtoken";
import jwtValidate from "./src/middlewares/jwtValidate.js";
setTZ("Asia/Bangkok");

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,DELETE,PUT",
  allowedHeaders: "Content-Type,Authorization",
};

const HOSTNAME = process.env.SERVER_IP;
const PORT = process.env.SERVER_PORT;
const SALT = 10;

dotenv.config();

const webServer = express();
webServer.use(cors());
webServer.use(express.json());
const ACTIVITY_KEYS = ["activityType", "hourGoal", "minuteGoal", "date"];

const MEMBER_DATA_KEYS = ["username", "password", "phoneNumber", "email"];
const LOGIN_DATA_KEYS = ["username", "password"];

webServer.post("/signup", async (req, res) => {
  let body = req.body;
  const missingFields = await checkMissingFields(body, MEMBER_DATA_KEYS);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Validation failed. The following fields are missing values:",
      missingFields: missingFields,
    });
  }

  const saltRound = await bcrypt.genSalt(SALT);
  body["password"] = await bcrypt.hash(body["password"], saltRound);

  await databaseClient.db().collection("members").insertOne(body);
  res.send("Create User Successfully");
});

webServer.post("/login", async (req, res) => {
  try {
    let body = req.body;
    const missingFields = await checkMissingFields(body, LOGIN_DATA_KEYS);

    if (missingFields.length > 0) {
      res.status(400).json({
        message: "Validation failed. The following fields are missing values:",
        missingFields: missingFields,
      });
      return;
    }

    const user = await databaseClient
      .db()
      .collection("members")
      .findOne({ username: body.username });
    if (user === null) {
      res.json({
        message: "Username or Password not correct",
      });
      return;
    }

    if (!bcrypt.compareSync(body.password, user.password)) {
      res.json({
        message: "Username or Password not correct",
      });
      return;
    }

    const returnMember = {
      user_id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    const token = jwt.sign(returnMember, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    console.log(token);

    returnMember["token"] = token;
    res.json(returnMember);
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal Server Error", status: "error" });
  }
});

webServer.get("/testToken", jwtValidate, async (req, res) => {
  // try {
  //   if (!req.headers["authorization"]) {
  //     return res.sendStatus(401);
  //   }
  // const token = req.headers["authorization"].replace("Bearer ","");
  // console.log(token);
  // const ret = jwt.verify(token, process.env.JWT_SECRET_KEY);
  // res.json(ret);
  // } catch (e) {
  //   return res.sendStatus(403);
  // }
  console.log("token validate passed");
  res.send("token validate passed");
});

webServer.post("/activityInfoGetData", jwtValidate, async (req, res) => {
  console.log(req.body.selectedDate);
  const user_id = req.body.user_id;
  let selectedDate = req.body.selectedDate;
  selectedDate = new Date(selectedDate).toLocaleDateString();
  selectedDate = new Date(selectedDate);
  selectedDate.setHours(selectedDate.getHours() + 7);
  const activityInfo = await databaseClient
    .db()
    .collection("activityInfo")
    .find({ user_id: user_id, date: selectedDate })
    .toArray();

  res.json(activityInfo);
});

webServer.get("/activityInfoChartDonut", async (req, res) => {
  try {
    const activityInfo = await databaseClient
      .db()
      .collection("activityInfo")
      .aggregate([
        {
          $group: {
            _id: "$activityType",
            total_duration: { $sum: "$actualTime" },
          },
        },
      ])
      .toArray();

    res.json({ data: activityInfo, status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", status: "error" });
  }
});

webServer.get("/activityInfoChartBar", async (req, res) => {
  try {
    const requestedWeek = req.query.week || getISOWeek(new Date());

    const activityInfoChartBar = await databaseClient
      .db()
      .collection("activityInfo")
      .aggregate([
        {
          $addFields: {
            dayOfWeek: { $dayOfWeek: "$date" },
            weekOfYear: { $week: "$date" },
          },
        },
        {
          $match: {
            weekOfYear: { $eq: requestedWeek - 1 },
          },
        },
        {
          $group: {
            _id: { dayOfWeek: "$dayOfWeek", weekOfYear: "$weekOfYear" },
            totalActualTime: { $sum: "$actualTime" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json({ data: activityInfoChartBar, status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", status: "error" });
  }
});

webServer.post("/activityInfo", jwtValidate, async (req, res) => {
  let date = new Date(req.body.date).toLocaleDateString();
  date = new Date(date);
  date.setHours(date.getHours() + 7);
  console.log(date);

  const newActivityItem = { ...req.body, date };

  const missingFields = await checkMissingFields(
    newActivityItem,
    ACTIVITY_KEYS
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

webServer.delete("/activityInfo/:id", jwtValidate, async (req, res) => {
  const id = req.params.id;
  await databaseClient
    .db()
    .collection("activityInfo")
    .deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({ message: "This activity was deleted successfully" });
});

webServer.put("/activityInfo", jwtValidate, async (req, res) => {
  let date = new Date(req.body.date).toLocaleDateString();
  date = new Date(date);
  date.setHours(date.getHours() + 7);
  const item = { ...req.body, date };
  const id = req.body._id;

  const missingFields = await checkMissingFields(item, ACTIVITY_KEYS);

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
  delete updateItem._id;
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
