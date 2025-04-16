import http from "node:http";
import nodePath from "node:path";
import fs from "node:fs";
import mime from "mime";
import url from "node:url";
import merge from "merge-descriptors";
import { match } from "path-to-regexp";

export function initialize() {
  // const getRoutes = {};
  const routes = [];

  const USE_METHOD_STRING = "__USE";

  //initialization
  const lib = {
    get: (path, handler) => {
      routes.push({ path, handler, method: "GET" });
    },
    post: (path, handler) => {
      routes.push({ path, handler, method: "POST" });
    },
    use: (path, handler) => {
      if (typeof path === "function") {
        routes.push({
          path: "*anything",
          handler: path,
          method: USE_METHOD_STRING,
        });
      } else if (typeof path === "string" && typeof handler === "function") {
        path =
          path[path.length - 1] === "/" ? path.slice(0, path.length - 1) : path;
        routes.push({
          path: path + `{/*anything}`,
          handler,
          method: USE_METHOD_STRING,
        });
      }
    },
    // Router: () => {
    //   return {
    //     get: (path, handler) => {
    //       routes.push({ path, handler, method: "GET" });
    //     },
    //     post: (path, handler) => {
    //       routes.push({ path, handler, method: "POST" });
    //     },
    //   };
    // },
  };

  const server = http.createServer((req, res) => {
    let lastMatchedIdx = -1;

    function next() {
      const nextMatchedRoute = routes.find((route, idx) => {
        const isMatch = match(route.path);
        const result = isMatch(url.parse(req.url).pathname);

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

      if (nextMatchedRoute) {
        const isMatch = match(nextMatchedRoute.path);
        const result = isMatch(url.parse(req.url).pathname);
        req.params = result.params;
        nextMatchedRoute.handler(req, res, next);
      }
    }
    next();
  });

  return merge(server, lib);
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 **/
export function staticRouter(req, res) {
  const reqUrl = url.parse(req.url);
  const reqPath = nodePath.join(
    reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname
  );
  const staticPath = nodePath.join("./", "public", reqPath);
  const fileExists = fs.existsSync(staticPath);

  if (fileExists) {
    const file = fs.readFileSync(staticPath);
    res.setHeader("Content-Type", mime.getType(staticPath));
    res.end(file);
    return true;
  }
  return false;
}
