import prisma from "../db.js";
import logger from "../modules/logger.js";
import { hashPassword, comparePassword, createJWTStudent } from "../modules/auth.js";

export const createStudent = async (req, res) => {
    logger.info(req.body);
    try {
        const student = await prisma.student.create({
            data: {
                fullName: req.body.fullName,
                regNo: req.body.regNo,
                batch: req.body.batch,
                email: req.body.email,
                phoneNo: req.body.phoneNo,
                password: await hashPassword(req.body.password),
            },
        });
        res.status(200).json({ student });
    } catch (err) {
        logger.error(err);
        res.status(400).json({ error: "User already exists or Internal server error" });
    }
};

export const studentLogin = async (req, res) => {
    const student = await prisma.student.findUnique({
        where: {
            regNo: req.body.regNo,
        },
    });

    if (!student) {
        logger.info("Student not found", req.body);
        return res.status(404).json({ error: "Student not found" });
    }

    const isPasswordValid = await comparePassword(req.body.password, student.password);

    if (isPasswordValid) {
        logger.info("Student successfully logged in");
        const token = createJWTStudent(student);
        return res.json({ token });
    } else {
        return res.status(401).json({ error: "Incorrect password" });
    }
};

export const getAllStudent = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            orderBy: {
                regNo: 'asc'
            }
        });
        return res.status(200).json({ students });
    } catch (err) {
        logger.error(err);
        return res.status(404).json({ error: "Students not found" });
    }
};

export const getSingleStudent = async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: {
                id: req.params.id,
            },
            select: {
                fullName: true,
                email: true,
                phoneNo: true,
                projectId: true,
                regNo: true,
                project: true,
            },
        });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        return res.json(student);
    } catch (err) {
        logger.error(err);
        return res.status(404).json({ error: "Student not found" });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const updatedStudent = await prisma.student.update({
            where: {
                id: req.params.id,
            },
            data: req.body,
        });

        return res.status(200).json(updatedStudent);
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad request" });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { regNo } = req.params;
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email id required" });
        }

        const user = await prisma.student.findFirst({
            where: {
                regNo,
                email,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "Invalid register number or email id" });
        }

        await prisma.student.update({
            where: {
                regNo,
            },
            data: {
                password: await hashPassword(password),
            },
        });

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad Request" });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const deletedStudent = await prisma.student.delete({
            where: {
                id: req.params.id,
            },
        });

        if (!deletedStudent) {
            return res.status(404).json({ error: "Student not found" });
        }

        return res.json("Deleted Student Successfully");
    } catch (err) {
        logger.error(err);
        return res.status(400).json({ error: "Bad Request" });
    }
};
