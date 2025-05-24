import prisma from "../db.js";
import logger from "../modules/logger.js";

import {
    comparePassword,
    hashPassword,
    createJWTAdmin,
} from "../modules/auth.js";

export const createAdmin = async () => {
    try {
        const getAdmin = await prisma.admin.findUnique({
            where: {
                email: process.env.ADMIN_EMAIL
            }
        })

        if(getAdmin === null) {
            const admin = await prisma.admin.create({
                data: {
                    fullName: process.env.ADMIN_FULLNAME,
                    email: process.env.ADMIN_EMAIL,
                    password: await hashPassword(process.env.ADMIN_PASSWORD),
                },
            });
            logger.info("Admin created")
        }
    } catch (err) {
        logger.error(err);
    }
};

export const adminLogin = async (req, res) => {
    const admin = await prisma.admin.findUnique({
        where: {
            email: req.body.email,
        },
    });

    if (!admin) {
        logger.info("Admin not found", req.body);
        return res.status(404).json({ error: "Admin not found" });
    }

    const isPasswordValid = await comparePassword(
        req.body.password,
        admin.password,
    );

    if (isPasswordValid) {
        logger.info("Admin successfully logged in");
        const token = createJWTAdmin(admin);
        return res.json({ token });
    } else {
        return res.status(401).json({ error: "incorrect password" });
    }
};

export const getAllAdmin = async (req, res) => {
    try {
        const admin = await prisma.admin.findMany();
        return res.status(200).json({ admin });
    } catch (err) {
        logger.error(err);
        return res.status(404).json({ error: "Admin not found" });
    }
};

export const getSingleAdmin = async (req, res) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        return res.json(admin);
    } catch (err) {
        logger.error(err);
        return res.status(404).json({ error: "Admin not found" });
    }
};

export const updateAdmin = async (req, res) => {
    try {
        const updatedAdmin = await prisma.admin.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
        });

        return res.status(200).json(updatedAdmin);
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad request" });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const deletedAdmin = await prisma.admin.delete({
            where: {
                id: req.params.id,
            },
        });

        if (!deletedAdmin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        return res.json("Deleted Admin Successfully");
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad Request" });
    }
};
