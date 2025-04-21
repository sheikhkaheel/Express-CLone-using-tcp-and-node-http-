import http from "node:http";
import nodePath from "node:path";
import url from "node:url";
import merge from "merge-descriptors";
import { match } from "path-to-regexp";
import mergeDescriptors from "merge-descriptors";
import {
  uniqueNamesGenerator,
  animals,
  colors,
  adjectives,
} from "unique-names-generator";

const USE_METHOD_STRING = "__USE";
function initialize() {
  const rootRouter = Router();

  const server = http.createServer((req, res) => {
    debugger;
    rootRouter(req, res, () => {});
  });

  return merge(server, rootRouter);
}

function Router() {
  const routes = [];

  const lib = {
    get: (path, ...handlers) => {
      for (let handler of handlers) {
        routes.push({ path, handler, method: "GET" });
      }
    },
    post: (path, ...handlers) => {
      for (let handler of handlers) {
        routes.push({ path, handler, method: "POST" });
      }
    },
    use: function (path, ...handlers) {
      if (typeof path === "function") {
        routes.push({
          path: "*anything",
          handler: path,
          method: USE_METHOD_STRING,
        });

        for (let handler of handlers) {
          routes.push({
            path: "*anything",
            handler: handler,
            method: USE_METHOD_STRING,
          });
        }
      } else if (typeof path === "string" && Array.isArray(handlers)) {
        path = path.endsWith("/") ? path.slice(0, path.length - 1) : path;
        for (let handler of handlers) {
          routes.push({
            path: path + `{/*anything}`,
            handler,
            method: USE_METHOD_STRING,
          });
        }
      }
      for (let handler of handlers) {
        handler = typeof path === "function" ? path : handler;
        const existingbaseUrl = this.baseUrl ?? "";
        handler.baseUrl = nodePath.join(
          existingbaseUrl,
          typeof path === "string" ? path : ""
        );
      }
      // console.log("In Use ====> ", handler.baseUrl);
    },
  };

  const router = (req, res, outerNext) => {
    console.log("Router========>", router._debug_name);
    // console.log(routes);
    let lastMatchedIdx = -1;
    const parsedPath = url.parse(req.url).pathname;
    // console.log("URl:", parsedPath);
    const ogReqUrl = req.url;
    // console.log("Onreq", ogReqUrl);

    function next() {
      console.log("Next ======>");
      req.url = ogReqUrl;
      // console.log("Req Url", req.url, ogReqUrl);
      setReqUrlProps(router.baseUrl ?? "", req);

      const nextMatchedRoute = routes.find((route, idx) => {
        const isMatch = match(route.path);
        const result = isMatch(parsedPath);
        // console.log("Result insider next", JSON.stringify(result.params));
        if (
          result &&
          idx > lastMatchedIdx &&
          (req.method === route.method || route.method === USE_METHOD_STRING)
        ) {
          lastMatchedIdx = idx;
          return true;
        } else {
          return false;
        }
      });

      let handler = nextMatchedRoute?.handler;
      if (handler) {
        const isMatch = match(nextMatchedRoute.path);
        const result = isMatch(parsedPath);
        // console.log("Result outsider next", JSON.stringify(result.params));
        req.params = result.params;
        // console.log("Before sending", req.url);
        handler(req, res, next);
      }
    }
    next();
    outerNext();
  };
  router._debug_name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
  });

  return mergeDescriptors(router, lib);
}

function setReqUrlProps(baseUrl, req) {
  req.baseUrl = baseUrl;
  // console.log("before", req.url, "base", req.baseUrl);

  if (req.baseUrl && req.url.startsWith(req.baseUrl)) {
    req.url = req.url.slice(req.baseUrl.length) || "/";
  }

  // console.log("after", req.url);
  req.path = new URL(
    `http://${process.env.HOSTNAME ?? "localhost"}` + req.url
  ).pathname;
}

initialize.Router = Router;
export default initialize;
