import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const comparePassword = (password, hash) => {
    return bcrypt.compare(password, hash);
};

export const hashPassword = (password) => {
    return bcrypt.hash(password, 7);
};

export const createJWTStudent = (user) => {
    const token = jwt.sign(
        {
            id: user.id,
            name: user.fullName,
            regNo: user.regNo,
            email: user.email,
            role: "student",
        },
        process.env.SECRET_KEY,
    );
    return token;
};

export const createJWTStaff = (user) => {
    const token = jwt.sign(
        {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: "staff",
        },
        process.env.SECRET_KEY,
    );
    return token;
};

export const createJWTAdmin = (user) => {
    const token = jwt.sign(
        {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: "admin",
        },
        process.env.SECRET_KEY,
    );
    return token;
};