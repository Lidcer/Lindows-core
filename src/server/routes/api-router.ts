import bodyParser from "body-parser";
import * as fileUpload from "express-fileupload";
import { Router } from "express";
import { setupIpApi } from "./ip/ip-api-routes";
import { IS_DEV } from "../config";

export function apiRouter() {
  const router = Router();

  router.use(bodyParser.urlencoded({ extended: false }));
  router.use(bodyParser.json());
  router.use(fileUpload.default());

  setupIpApi(router);

  return router;
}
