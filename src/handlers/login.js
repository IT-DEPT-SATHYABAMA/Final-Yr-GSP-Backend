import logger from "../modules/logger.js";

import { studentLogin } from "./student.js";
import { staffLogin } from "./staff.js";
import { adminLogin } from "./admin.js";

export const signIn = async (req, res) => {
    try {
        const role = req.params.role;

        switch (role) {
            case "admin":
                await adminLogin(req, res);
                break;
            case "student":
                await studentLogin(req, res);
                break;
            case "staff":
                await staffLogin(req, res);
                break;
        }
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad request" });
    }
};
