import * as dotenv from "dotenv";
import app from "./server.js";
import logger from "./modules/logger.js";
import { createAdmin } from "./handlers/admin.js"

dotenv.config();

const port = process.env.PORT || 5000;
// const port = 7778;

app.listen(port, () => {
    logger.info(`listening on http://localhost:${port}`);
});

(async () => {
    await createAdmin()
})();
