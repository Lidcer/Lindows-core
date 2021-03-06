import dotenv from "dotenv";
import findUp from "find-up";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

type DatabaseType = "mongoDB" | "mySql" | "none";

interface IConfig {
  SERVER_PORT?: number;
  PRIVATE_KEY?: string;
  SENDGRIND_API_KEY?: string;
  SECRET?: string;
}

const IS_DEV = process.env.NODE_ENV !== "production";

if (IS_DEV) {
  dotenv.config({ path: findUp.sync(".env") });
}

let config: IConfig = {
  PRIVATE_KEY: "",
  SECRET: "",
  SERVER_PORT: 5050,
};

const packageJsonPath = path.join(process.cwd(), "package.json");
const configJsonPath = path.join(process.cwd(), "config.json");
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

try {
  const rawConfigJson = fs.readFileSync(configJsonPath).toString();
  config = JSON.parse(rawConfigJson);
} catch (error) {
  /* ignored */
}

if (!config.PRIVATE_KEY || !config.SECRET) {
  regenerateConfig();
}

// server
const SERVER_PORT = process.env.PORT || config.SERVER_PORT || 5050;
const WEBPACK_PORT = 8085; // For dev environment only
const PRIVATE_KEY = config.PRIVATE_KEY;
const SENDGRIND_API_KEY = config.SENDGRIND_API_KEY;
const SECRET = config.SECRET;

export function regenerateConfig(shouldShutDownServer = false) {
  config.PRIVATE_KEY = randomBytes(64).toString("base64");
  config.SECRET = randomBytes(64).toString("base64");
  updateConfig();
  if (shouldShutDownServer) {
    console.log("\n\n\n\n");
    console.log("========================");
    console.warn("SHUTING DOWN SERVER");
    console.log("========================");
    process.exit(0);
  }
}

function updateConfig() {
  fs.writeFileSync(configJsonPath, JSON.stringify(config, undefined, 1));
}

export { IS_DEV, VERSION, SERVER_PORT, WEBPACK_PORT, PRIVATE_KEY, SENDGRIND_API_KEY, SECRET };
