import prisma from "../db.js";
import logger from "../modules/logger.js";
// import fs from "fs/promises";

import {
    hashPassword,
    createJWTStaff,
    comparePassword,
} from "../modules/auth.js";

export const createStaff = async (req, res) => {
    logger.info(req.body);
    try {
        // const fileData = await fs.readFile(req.file.path);
        const staff = await prisma.staff.create({
            data: {
                fullName: req.body.fullName,
                email: req.body.email,
                password: await hashPassword(req.body.password),
                profileImg: req.file.buffer,
                specializations: req.body.specializations,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        logger.info("Staff created:", staff);

        res.status(200).json({ staff });
    } catch (err) {
        // logger.error(err);
        console.log(err);
        res.status(400).json({ error: "Internal server error" });
    }
};

export const staffLogin = async (req, res) => {
    const staff = await prisma.staff.findUnique({
        where: {
            email: req.body.email,
        },
    });

    if (!staff) {
        logger.info("Staff not found", req.body);
        return res.status(404).json({ error: "Staff not found" });
    }

    const isPasswordValid = await comparePassword(
        req.body.password,
        staff.password,
    );

    if (isPasswordValid) {
        logger.info("Staff successfully logged in");
        const token = createJWTStaff(staff);
        return res.json({ token });
    } else {
        return res.status(401).json({ error: "incorrect password" });
    }
};

export const getAllStaff = async (req, res) => {
    try {
        const staffs = await prisma.staff.findMany()

        if(!staffs || staffs.length === 0) {
            return res.status(404).json({error : "No staff found"})
        }

        const foramattedStaffs = staffs.map((staff) => ({
            id: staff.id,
            fullName: staff.fullName,
            email: staff.email,
            profileImg: staff.profileImg ? `data:image/jpeg;base64,${Buffer.from(staff.profileImg).toString('base64')}` : null,
            specializations: staff.specializations
        }))

        return res.status(200).json({staff: foramattedStaffs})

    } catch (err) {
        logger.error(err)
    }
}

export const getSingleStaff = async (req, res) => {
    try {
        const staff = await prisma.staff.findUnique({
            where: {
                id: req.params.id,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                specializations: true,// Add other necessary fields here
                projects: {
                    select: {
                        title: true,
                        review: true,
                        students: {
                            select: {
                                fullName: true,
                                regNo: true,
                            }
                        },

                    }
                },
            }
        });

        if (!staff) {
            return res.status(404).json({ error: "Staff not found" });
        }

        return res.json(staff);
    } catch (err) {
        logger.error(err);
        return res.status(404).json({ error: "Staff not found" });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const updatedStaff = await prisma.staff.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
        });

        return res.status(200).json(updatedStaff);
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad request" });
    }
};

export const deleteStaff = async (req, res) => {
    try {

        const projects = await prisma.projects.deleteMany({
            where: {
                staffId: req.params.id
            }
        })

        const deletedStaff = await prisma.staff.delete({
            where: {
                id: req.params.id,
            },
        });

        if(!projects) {
            return res.status(404).json({ error: "Projects not found" });
        }

        if (!deletedStaff) {
            return res.status(404).json({ error: "Staff not found" });
        }

        return res.json("Deleted Staff Successfully");
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad Request" });
    }
};