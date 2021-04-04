// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./fix.d.ts" />
import express from "express";
import path from "path";
import { apiRouter } from "./routes/api-router";
import { pagesRouter } from "./routes/pages-router";
import { staticsRouter } from "./routes/statics-router";
import * as config from "./config";
import { WebSocket } from "./websocket/SocketHandler";
import session from "express-session";
import { SECOND, WEEK } from "../shared/constants";
import { IS_DEV } from "./config";
import { setupAppWebsocket } from "./apps/appComunnicate";
import { Logger as Log } from "./Logger";
import { startup } from "./startup";
import { setupClientVisibility } from "./websocket/ClientVisibility";
(global as any).Logger = Log;
(global as any).DEV = IS_DEV;

export const name = "Lindows";
export const version = "0.0.1 Alpha";
export const fullName = `${name}, ${version}`;
const sessionName = "Lindows_sessions";

console.info(`*******************************************`);
console.info(`App: ${fullName}`);
console.info(`NODE_ENV: ${process.env.NODE_ENV}`);
console.info(`config: ${JSON.stringify(config, null, 2)}`);
console.info(`*******************************************`);

let store: session.Store | undefined;
const maxAge = WEEK * 2;
const s = false;
const theSession = session({
  name: fullName,
  resave: true,
  proxy: s,
  rolling: true,
  saveUninitialized: true,
  secret: config.SECRET,
  store,
  cookie: {
    maxAge,
    sameSite: true,
    secure: s,
  },
});

const app = express();
app.set("view engine", "ejs");
app.set("trust proxy", true);
app.use("/assets", express.static(path.join(process.cwd(), "assets")));
app.use(theSession);
app.use(apiRouter());
app.use(staticsRouter());
app.use(pagesRouter());
app.disable("x-powered-by");

startup.addTask(() => {
  const http = app.listen(config.SERVER_PORT, () => {
    console.log(`App listening on port ${config.SERVER_PORT}!`);
  });
  const websocket = new WebSocket(http);
  setupAppWebsocket(websocket);
  setupClientVisibility(websocket);
});

async function start() {
  try {
    await startup.start();
    Logger.info("Server started");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
setTimeout(() => {
  start();
}, SECOND);

process.on("uncaughtException", uncaughtException => {
  Logger.fatal("uncaughtException", uncaughtException);
  process.exit(1);
});

process.on("unhandledRejection", unhandledRejection => {
  Logger.fatal("unhandledRejection", unhandledRejection);
});
