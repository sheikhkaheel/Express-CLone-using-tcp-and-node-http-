import express from "express";

const app = express();

app.get("/post", (req, res, next) => {
  console.log("1");
  res.send("hi");
  next();
  console.log("next");
});

app.get("/post", (req, res, next) => {
  console.log("2");
  res.send("helo");
  // next();
});

app.get("/post", (req, res) => {
  console.log("3");
});

app.listen(3000, () => {
  console.log("Server is Running on Port 3000");
});
