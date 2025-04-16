import { initialize } from "./tcpserver.js";

const app = initialize();

app.use("/use", (req, res, next) => {
  console.log(req.path, "USE 1 with params ", req.params.id);
  // res.send(`<h1>Use route ${req.path} and Params => ${req.params.id}</h1>`);
  next();
});

app.get("/use/:id/:name", (req, res, next) => {
  console.log(req.path, "GET 1 with params ", req.params.id);
  res.send(
    `<h1>Get route ${req.path} and Params => ${req.params.id} , ${req.params.name}</h1>`,
    200,
    "text/html",
    10
  );
  // next();
});

app.listen(3000, "localhost", () => {
  console.log("Listing on port 3000");
});
