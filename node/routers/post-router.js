//server.js
const http = require("node:http");
const merge = require("merge-descriptors");
const path = require("node:path");
const url = require("node:url");
const { match } = require("path-to-regexp");
const {
  uniqueNamesGenerator,
  animals,
  colors,
  adjectives,
} = require("unique-names-generator");

const USE_METHOD_STRING = "__USE";

function initialize() {
  const rootRouter = Router();
  const server = http.createServer((req, res) => {
    rootRouter(req, res, () => {});
  });

  return merge(server, rootRouter);
}

function Router() {
  let routes = [];

  const lib = {
    get: (pattern, handler) => {
      routes.push({ method: "GET", pattern, handler });
    },
    post: (pattern, handler) => {
      routes.push({ method: "POST", pattern, handler });
    },
    use: function (patternOrHandler, handler) {
      if (typeof patternOrHandler === "function") {
        routes.push({
          pattern: "*s",
          handler: patternOrHandler,
          method: USE_METHOD_STRING,
        });
      } else if (
        typeof patternOrHandler === "string" &&
        typeof handler === "function"
      ) {
        let pattern =
          patternOrHandler[patternOrHandler.length - 1] === "/"
            ? patternOrHandler.slice(0, patternOrHandler.length - 1)
            : patternOrHandler;
        routes.push({
          pattern: pattern + `{/*s}`,
          handler,
          method: USE_METHOD_STRING,
        });
      }
      handler =
        typeof patternOrHandler === "function" ? patternOrHandler : handler;
      const existingbaseUrl = this.baseUrl ?? "";
      handler.baseUrl = path.join(
        existingbaseUrl,
        typeof patternOrHandler === "string" ? patternOrHandler : ""
      );
    },
  };
  const router = (req, res, outerNext) => {
    let index = 0;

    const ogReqUrl = req.url;

    function next() {
      debugger;
      req.url = ogReqUrl;
      // console.log("ogUrl", ogReqUrl)
      setReqUrlProps(router.baseUrl ?? "", req);

      const parsedPathName = req.path;
      let matchedRoutes = routes.filter((r) => {
        const matchFn = match(r.pattern);
        const matchResult = matchFn(parsedPathName);
        console.log(matchResult);

        return (
          matchResult &&
          (r.method === req.method || r.method === USE_METHOD_STRING)
        );
      });

      let handlerFn = matchedRoutes[index]?.handler;
      if (handlerFn) {
        const matchFn = match(matchedRoutes[index]?.pattern);
        const matchResult = matchFn(parsedPathName);
        req.params = matchResult.params;
        index++;
        setReqUrlProps(handlerFn.baseUrl ?? router.baseUrl, req);
        handlerFn(req, res, next);
      }
    }

    next();
    outerNext();
  };
  router._debug_name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
  }); // big_red_donkey

  return merge(router, lib);
}

function setReqUrlProps(baseUrl, req) {
  req.baseUrl = baseUrl;
  console.log("before", req.url, "base", req.baseUrl);
  req.url = req.baseUrl ? req.url.split(req.baseUrl)[1] : req.url;
  console.log("after", req.url);
  req.path = new URL(
    `http://${process.env.HOSTNAME ?? "localhost"}` + req.url
  ).pathname;
}

initialize.Router = Router;
module.exports = initialize;
