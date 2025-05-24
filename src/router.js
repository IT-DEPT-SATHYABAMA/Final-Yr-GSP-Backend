import {Router} from "express";

import {upload} from "./modules/multer.js";

import {
    getSingleStudent,
    updateStudent,
    deleteStudent
} from "./handlers/student.js";
import {
    createStaff,
    getSingleStaff,
    deleteStaff,
    updateStaff
} from "./handlers/staff.js";
import {
    createAdmin,
    getAllAdmin,
    getSingleAdmin,
    updateAdmin,
    deleteAdmin
} from "./handlers/admin.js";

import {
    registerProject,
    getAllProjects,
    getAllProjectByStage,
    getSingleProject,
    getAllProjectsForSingleStaff, deleteProject,
    // updateReviewByProjectId
} from "./handlers/project.js";

import { updateReview } from "./handlers/review.js"

const router = Router()

router.get("/students/:id", getSingleStudent);
// student signup
// router.post("/student", createStudent);
// update student
router.put("/students/:id", updateStudent);
// delete student
router.delete("/students/:id", deleteStudent);

router.get("/staffs/:id", getSingleStaff);
router.post("/staffs", upload.single("profileImg"), createStaff);
router.put("/staffs/:id", updateStaff);
router.delete("/staffs/:id", deleteStaff);

router.get("/admins", getAllAdmin);
router.get("/admins/:id", getSingleAdmin);
router.post("/admins", createAdmin);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

// Projects
router.post("/projects", registerProject);
router.get("/projects", getAllProjects);
router.get("/projects/reviews", getAllProjectByStage);
router.get("/projects/:id", getSingleProject);
router.get("/projects/:staffId/reviews/", getAllProjectsForSingleStaff)
// router.put("/projects/:projectId/staff/:staffId/review", updateReviewByProjectId)
router.delete("/projects/:projectId", deleteProject)

// Review
router.put('/reviews/:reviewId/project', updateReview)

export default router