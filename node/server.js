import initialize from "./nodehttp.js";

const app = initialize();

// const router = initialize.Router();

// router.get("/*s", (req, res, next) => {
//   console.log("Inside router route");
//   res.end(`Base ${req.baseUrl}, path ${req.path} , url ${req.url}`);
//   next();
// });

// router.get("/*s", (req, res, next) => {
//   console.log("Inside router route");
//   res.end(`<h1>This is the router 2 route</h1>`);
// });

// app.use("/router", router);

app.use(jsonParser);

app.use(
  (req, res, next) => {
    console.log("Middleware");
    next();
  },
  (req, res, next) => {
    console.log("Normal");
    res.end(`Normal Router ${req.method === "POST" && req.body["name"]}`);
  }
);

function jsonParser(req, res, next) {
  if (req.headers["content-type"] !== "application/json") return next();
  let body = "";
  req.on("data", (data) => {
    let chunk = data.toString();
    body += chunk;
  });
  req.on("end", () => {
    req.body = JSON.parse(body);
    next();
  });
}

app.listen(3000, "localhost", () => {
  console.log("Server is Running on Port 3000");
});
