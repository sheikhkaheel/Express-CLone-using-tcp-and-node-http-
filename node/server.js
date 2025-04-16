import { initialize, staticRouter } from "./nodehttp.js";

const app = initialize();

app.use("/post", (req, res, next) => {
  console.log("Use 1");
  next();
});

app.get("/post/:id", (req, res) => {
  console.log("Use 2");
  res.end("Use 2");
});

app.listen(3000, "localhost", () => {
  console.log("Server is Running on Port 3000");
});
