import net from "net";
import mergeDescriptors from "merge-descriptors";
import { match } from "path-to-regexp";

/**
 *
 * @param {net.Socket} socket
 */

const onConnection = (socket, route) => {
  const request = {
    route: "",
    method: "",
    path: "",
    body_content: "",
    headers: { "content-legnth": 0 },
    params: "",
    streaming: true,
  };

  socket.on("data", (packet) => {
    parsePacket(packet, socket, request, route);
  });

  socket.on("close", (error) => {
    if (error) {
      console.log("Connection Dropped");
    }
  });
};

const server = (route) => {
  return net.createServer((socket) => onConnection(socket, route));
};

/**
 *
 * @param {Buffer} packet
 * @param {net.Socket} socket
 * @param {{
 * path: "",
 * method: "",
 * body_content: "",
 * content_length: 0,
 * headers: Record<string, string|number> & {"content-length": number}
 * streaming: true,
 * }} request
 * @returns
 */

async function parsePacket(packet, socket, request, route) {
  const packetStr = packet.toString("utf-8");
  let chunk = "";
  if (request.body_content.length <= 0) {
    //runs only on the first packet
    let [[reqLine, rawHeaders], firstChunk] = packetStr
      .split("\r\n\r\n")
      .map((el, idx) => {
        if (idx === 0) {
          const lines = el.split("\r\n");
          const reqLine = lines.shift();
          return [reqLine, lines.join("\r\n")];
        }
        return el;
      });
    chunk = firstChunk;

    const headers = rawHeaders.split("\r\n");
    request.headers = Object.fromEntries(
      headers.map((header) => {
        const parts = header.split(": ");
        const key = parts.shift();
        const value = parts.join(": ");
        return [key, value];
      })
    );
    request.headers["content-length"] = request.headers["content-length"]
      ? Number(request.headers["content-length"])
      : 0;
    request.method = reqLine.split(" ")[0];
    request.path = reqLine.split(" ")[1];
  }

  //runs on every packet even the first and last one
  if (chunk !== "") {
    chunk = chunk || packetStr;
    request.body_content += chunk;
  }

  // console.log("\nPacket Received");
  request.streaming = !(
    Number(request.body_content.length) >=
    Number(request.headers["content-length"])
  );

  if (!request.streaming) {
    await sendResponse(socket, request, route);

    //process
    // await sendResponse(request, socket);

    //cleanup
    request.path = "";
    request.method = "";
    request.body_content = "";
    request.headers = { "content-legnth": 0 };
    request.streaming = true;
    request.params = "";

    // end
  }

  //end
  // console.log("End of Request \n");
}

async function sendResponse(socket, request, route) {
  let lastIdx = -1;

  function next() {
    const nextMatchedRoute = route.find((route, idx) => {
      const isMatch = match(route.path);
      const result = isMatch(request.path);
      if (
        result &&
        (route.method === request.method || route.method == "__USE") &&
        idx > lastIdx
      ) {
        lastIdx = idx;
        return true;
      } else {
        return false;
      }
    });

    if (nextMatchedRoute) {
      const isMatch = match(nextMatchedRoute.path);
      const result = isMatch(request.path);
      request.params = result.params;

      nextMatchedRoute.handler(
        request,
        {
          send: (
            data,
            status = "200",
            content_type = "text/html",
            content_length
          ) => {
            socket.write(
              `HTTP/1.1 ${status} OK \r\n
               Content-Type: ${content_type} \r\n
               Content-Length: ${content_length}
               \r\n\r\n`
            );
            socket.write(data);
            socket.end();
          },
        },
        next
      );
    }
  }

  next();
}

export function initialize() {
  const route = [];
  const USE_METHOD_STRING = "__USE";

  const lib = {
    get: (path, handler) => {
      route.push({ path, handler, method: "GET" });
    },
    post: (path, handler) => {
      route.push({ path, handler, method: "POST" });
    },
    use: (path, handler) => {
      if (typeof path === "function") {
        route.push({
          path: "*anything",
          handler: path,
          method: USE_METHOD_STRING,
        });
      } else if (typeof path === "string" && typeof handler === "function") {
        path =
          path[path.length - 1] === "/" ? path.slice(0, path.length - 1) : path;

        route.push({
          path: path + "{/*anything}",
          handler,
          method: USE_METHOD_STRING,
        });
      }
    },
  };

  return mergeDescriptors(server(route), lib);
}

// async function sendResponse(request, socket) {
//   const { method, route } = request;
//   if (method === "GET") {
//     console.log("Inside Get Response");

//     if (fs.existsSync(path.join("public", route))) {
//       const data = getFileFromRoute(
//         path.join(route) === "/" ? "index.html" : route
//       );
//       responseString(socket, 200, route, null, data);
//     } else {
//       const data = getFileFromRoute("/page-not-found.html");
//       responseString(socket, 200, "/page-not-found.html", null, data);
//     }
//   } else if (method === "POST") {
//     console.log("Inside Post Response");
//     if (route == "/sayhello") {
//       responseString(
//         socket,
//         200,
//         "text/html",
//         `<html><h1>HELLO ${request.body_content}</h1></html>`
//       );
//     }
//   }
//   socket.end();
// }

// function getFileFromRoute(route) {
//   console.log(route.toLowerCase());

//   const fullPath = path.join("public", route);
//   console.log("Path", fullPath.toLocaleLowerCase());

//   try {
//     if (fs.existsSync(fullPath.toLocaleLowerCase())) {
//       const file = fs.readFileSync(fullPath.toLocaleLowerCase());
//       return file;
//     } else {
//       return false;
//     }
//   } catch (err) {
//     return false;
//   }
// }

// export function responseString(
//   socket,
//   statusCode,
//   fileName,
//   content_type,
//   data
// ) {
//   if (fileName && content_type === null) {
//     content_type = mime.getType(fileName);
//   }
//   socket.write(
//     `HTTP/1.1 ${statusCode} OK \r\n` +
//       `Content-Type:` +
//       content_type +
//       `\r\n\r\n`
//   );
//   socket.write(data);
// }
