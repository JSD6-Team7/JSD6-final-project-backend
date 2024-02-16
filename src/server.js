import express from "express";
import db from "../database.mjs";
import cors from "cors";
import { MongoClient } from "mongodb";
const uri =
  "mongodb+srv://corgyslurpy:o882b5NKdjBcAaQt@corgyslurpy.xhkzp7t.mongodb.net/";

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const userSchema = {
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 }, // Enforce password strength
  // ...other fields if needed
};

// Route handlers:
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`DATABASE IS CONNECTED: NAME => ${db.databaseName}`);
});

//Users

app.post("/users", async (req, res) => {
  try {
    const user = req.body;

    // Save user to database
    const savedUser = await connectToDatabase
      .collection("users")
      .insertOne(user);

    // Respond with success message, excluding sensitive information
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/users/create", async (req, res) => {
  const user = req.body;
  const client = new MongoClient(uri);
  await client.connect();
  await client
    .db("sample_training")
    .collection("users")
    .insertOne({
      id: parseInt(user.id),
      username: user.username,
      birthday: user.birthday,
      gender: user.gender,
      email: user.email,
      weight: user.weight,
      height: user.height,
      avatar: user.avatar,
    });
  await client.close();
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + user.id + " is created",
    user: user,
  });
});

app.post("/member/create", async (req, res) => {
  const user = req.body;
  const client = new MongoClient(uri);
  await client.connect();
  await client
    .db("sample_training")
    .collection("member")
    .insertOne({
      id: parseInt(user.id),
      username: user.username,
      password: user.password,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });
  await client.close();
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + user.id + " is created",
    user: user,
  });
});

app.get("/users", async (req, res) => {
  const id = parseInt(req.params.id);
  const client = new MongoClient(uri);
  await client.connect();
  const users = await client
    .db("sample_training")
    .collection("users")
    .find({})
    .toArray();
  await client.close();
  res.status(200).send(users);
});

app.get("/member", async (req, res) => {
  const id = parseInt(req.params.id);
  const client = new MongoClient(uri);
  await client.connect();
  const users = await client
    .db("sample_training")
    .collection("member")
    .find({})
    .toArray();
  await client.close();
  res.status(200).send(users);
});

app.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const client = new MongoClient(uri);
  await client.connect();
  const user = await client
    .db("sample_training")
    .collection("users")
    .findOne({ id: id });
  await client.close();
  res.status(200).send({
    status: "ok",
    user: user,
  });
});

app.put("/users/update", async (req, res) => {
  const user = req.body;
  const id = parseInt(user.id);

  const fieldsToUpdate = {};

  // ตรวจสอบว่ามีการส่งค่า fname มาหรือไม่
  if (user.username) {
    fieldsToUpdate.username = user.username;
  }

  // ตรวจสอบว่ามีการส่งค่า lname มาหรือไม่
  if (user.birthday) {
    fieldsToUpdate.birthday = user.birthday;
  }

  if (user.gender) {
    fieldsToUpdate.gender = user.gender;
  }

  if (user.email) {
    fieldsToUpdate.email = user.email;
  }

  if (user.weight) {
    fieldsToUpdate.weight = user.weight;
  }

  if (user.height) {
    fieldsToUpdate.height = user.height;
  }

  if (user.avatar) {
    fieldsToUpdate.avatar = user.avatar;
  }

  // ... ตรวจสอบค่าอื่น ๆ ที่ต้องการอัปเดต ...

  const client = new MongoClient(uri);
  await client.connect();

  // กำหนดตัวเลือกการอัปเดต
  const updateOptions = {
    $set: fieldsToUpdate,
  };

  // เรียกใช้ `updateOne`
  await client
    .db("sample_training")
    .collection("users")
    .updateOne({ id: id }, updateOptions);
  await client.close();

  // ส่งข้อความตอบกลับ
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + id + " is updated",
    user: user,
  });
});

app.put("/users/editpassword", async (req, res) => {
  const user = req.body;
  const id = parseInt(user.id);

  const fieldsToUpdate = {};

  // ตรวจสอบว่ามีการส่งค่า lname มาหรือไม่
  if (user.password) {
    fieldsToUpdate.password = user.password;
  }

  // ... ตรวจสอบค่าอื่น ๆ ที่ต้องการอัปเดต ...

  const client = new MongoClient(uri);
  await client.connect();

  // กำหนดตัวเลือกการอัปเดต
  const updateOptions = {
    $set: fieldsToUpdate,
  };

  // เรียกใช้ `updateOne`
  await client
    .db("sample_training")
    .collection("member")
    .updateOne({ id: id }, updateOptions);
  await client.close();

  // ส่งข้อความตอบกลับ
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + id + " is updated",
    user: user,
  });
});

app.put("/users/editemail", async (req, res) => {
  const user = req.body;
  const id = parseInt(user.id);

  const fieldsToUpdate = {};

  // ตรวจสอบว่ามีการส่งค่า lname มาหรือไม่
  if (user.email) {
    fieldsToUpdate.email = user.email;
  }

  // ... ตรวจสอบค่าอื่น ๆ ที่ต้องการอัปเดต ...

  const client = new MongoClient(uri);
  await client.connect();

  // กำหนดตัวเลือกการอัปเดต
  const updateOptions = {
    $set: fieldsToUpdate,
  };

  // เรียกใช้ `updateOne`
  await client
    .db("sample_training")
    .collection("member")
    .updateOne({ id: id }, updateOptions);
  await client.close();

  // ส่งข้อความตอบกลับ
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + id + " is updated",
    user: user,
  });
});

app.get("/member/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const client = new MongoClient(uri);
  await client.connect();
  const user = await client
    .db("sample_training")
    .collection("member")
    .findOne({ id: id });
  await client.close();
  res.status(200).send({
    status: "ok",
    user: user,
  });
});

app.delete("/users/delete", async (req, res) => {
  const id = parseInt(req.body.id);
  const client = new MongoClient(uri);
  await client.connect();
  await client.db("sample_training").collection("users").deleteOne({ id: id });
  await client.close();
  res.status(200).send({
    status: "ok",
    message: "User with ID = " + id + " is deleted",
  });
});
