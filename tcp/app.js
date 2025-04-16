import { initialize } from "./tcpserver.js";

const app = initialize();

app.use("/use", (req, res, next) => {
  console.log(req.path, "USE 1");
  // res.send(`<h1>USE 1</h1>`);
  next();
});

app.get("/use/:id", (req, res, next) => {
  console.log(req.path, "GET 1");
  res.send(`<h1>Get route ${req.path} and Params => ${req.params.id}</h1>`);
  // next();
});

app.listen(3000, "localhost", () => {
  console.log("Listing on port 3000");
});
