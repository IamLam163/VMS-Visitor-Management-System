//import mongoose from "mongoose";
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model("User", userSchema);

mongoose
  .connect(process.env.MONGO_DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log("Connected to Database");

    const user = new User({
      username: process.env.USERNAME,
      password: process.env.PASSWORD
    });

    await user.save();
    console.log("User created");

    mongoose.connection.close();
  })

  .catch((err) => {
    console.log("Database connection failed", err.toString());
  });

mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
