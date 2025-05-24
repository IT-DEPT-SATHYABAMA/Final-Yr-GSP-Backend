import prisma from "../db.js";
import logger from "../modules/logger.js";

const MAX_STUDENTS_IN_PROJECT = 2;
const MAX_PROJECT_COUNT = 12;

export const registerProject = async (req, res) => {
    try {
        const {studentIds, staffId, title} = req.body;

        if (!staffId) {
            return res.status(400).json({error: "Staff ID is required"});
        }

        // Check if the staff already has MAX_PROJECT_COUNT projects
        const staffProjectsCount = await prisma.project.count({
            where: {
                staffId: staffId,
            },
        });

        if (staffProjectsCount >= MAX_PROJECT_COUNT) {
            return res.status(400).json({error: `The selected guide already has ${MAX_PROJECT_COUNT} projects`});
        }

        if (studentIds.length > MAX_STUDENTS_IN_PROJECT) {
            return res.status(400).json({error: `Only ${MAX_STUDENTS_IN_PROJECT} students are allowed per project`});
        }

        const foundStudentsResults = await Promise.allSettled(
            studentIds.map(async (id) =>
                prisma.student.findFirst({
                    where: {id},
                })
            )
        );

        logger.debug(foundStudentsResults, "Found students from DB");

        const foundStudents = foundStudentsResults.filter(result => result.status === "fulfilled").map(result => result.value);

        if (foundStudents.length !== studentIds.length) {
            return res.status(404).json({error: "One or more students not found"});
        }

        // Check if any of the students are already part of a project
        const existingStudentInProjects = await prisma.project.findMany({
            where: {
                students: {
                    some: {
                        id: {
                            in: studentIds,
                        },
                    },
                },
            },
            select: {
                students: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (existingStudentInProjects.length > 0) {
            return res.status(400).json({error: "The selected student is already assigned to a project"});
        }

        // Create the project and related review stages
        const project = await prisma.project.create({
            data: {
                title: title,
                students: {
                    connect: studentIds.map((id) => ({id})),
                },
                staff: {
                    connect: {id: staffId},
                },
                review: {
                    create: {
                        reviewZero: {
                            create: {}
                        },
                        reviewOne: {
                            create: {}
                        },
                        reviewTwo: {
                            create: {}
                        },
                        reviewThree: {
                            create: {}
                        },
                        reviewModel: {
                            create: {}
                        },
                        reviewFinal: {
                            create: {}
                        }
                    }
                }
            },
            include: {
                review: {
                    include: {
                        reviewZero: true,
                        reviewOne: true,
                        reviewTwo: true,
                        reviewThree: true,
                        reviewModel: true,
                        reviewFinal: true,
                    }
                }
            }
        });

        res.status(200).json({project});
    } catch (err) {
        logger.error(err);
        res.status(500).json({error: err.message});
    }
};

export const getAllProjects = async (req, res) => {

    try {
        const projects = await prisma.project.findMany({
            include: {
                review: {
                    select: {
                        // stage: true,
                        reviewZero: true,
                        reviewOne: true,
                        reviewTwo: true,
                        reviewThree: true,
                        reviewModel: true,
                        reviewFinal: true
                    }
                },
                students: {
                    select: {
                        fullName: true,
                        regNo: true
                    }
                },
                staff: {
                    select: {
                        fullName: true,
                    }
                }
            }
        })

        return res.status(200).json({projects})
    } catch (err) {
        logger.error(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const getAllProjectByStage = async (req, res) => {
    try {
        const {stage} = req.query;

        if (!stage) {
            return res.status(400).json({error: "Stage query parameter is required"});
        }

        const reviewFields = {
            "zero": "reviewZero",
            "one": "reviewOne",
            "two": "reviewTwo",
            "three": "reviewThree",
            "model": "reviewModel",
            "final": "reviewFinal"
        };

        const reviewField = reviewFields[stage];

        if (!reviewField) {
            return res.status(400).json({error: "Invalid stage value"});
        }

        const projects = await prisma.project.findMany({
            include: {
                review: {
                    select: {
                        [reviewField]: true
                    }
                },
                students: {
                    select: {
                        fullName: true,
                        regNo: true
                    }
                },
                staff: {
                    select: {
                        fullName: true
                    }
                }
            }
        });

        return res.status(200).json({projects});
    } catch (err) {
        logger.error(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
};

export const getSingleProject = async (req, res) => {
    try {
        const projectId = req.params.id

        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
            include: {
                students: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        batch: true,
                        regNo: true,
                        phoneNo: true
                    }
                },
                review: {
                    select: {
                        id: true,
                        reviewZero: true,
                        reviewOne: true,
                        reviewTwo: true,
                        reviewThree: true,
                        reviewModel: true,
                        reviewFinal: true
                    }
                },
                staff: {
                    select: {
                        fullName: true,
                    }
                }
            }
        })

        if (!project) {
            return res.status(404).json({error: "Project not found"});
        }

        return res.status(200).json(project);

    } catch (err) {
        logger.error(err);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

export const getAllProjectsForSingleStaff = async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const {stage} = req.query;

        // Check if the staff member exists
        const staff = await prisma.staff.findUnique({
            where: {
                id: staffId
            }
        });

        if (!staff) {
            return res.status(404).json({error: "Staff member not found"});
        }

        let projects;

        if (stage) {
            const reviewFields = {
                "zero": "reviewZero",
                "one": "reviewOne",
                "two": "reviewTwo",
                "three": "reviewThree",
                "model": "reviewModel",
                "final": "reviewFinal"
            };

            const reviewField = reviewFields[stage];

            if (!reviewField) {
                return res.status(400).json({error: "Invalid stage value"});
            }

            // Retrieve projects with the specified review stage
            projects = await prisma.project.findMany({
                where: {
                    staffId: staffId
                },
                include: {
                    students: {
                        select: {
                            fullName: true,
                            regNo: true,
                            phoneNo: true,
                            email: true
                        }
                    },
                    review: {
                        select: {
                            id: true,
                            [reviewField]: true
                        }
                    }
                }
            });
        } else {
            // Retrieve all projects for the staff member
            projects = await prisma.project.findMany({
                where: {
                    staffId: staffId
                },
                include: {
                    students: {
                        select: {
                            fullName: true,
                            regNo: true,
                            phoneNo: true,
                            email: true
                        }
                    },
                    review: true
                }
            });
        }

        return res.status(200).json({projects});
    } catch (err) {
        console.error('Error retrieving projects:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if the project exists before proceeding
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json("Project not found.");
        }

        // Find the review associated with the project
        const foundReview = await prisma.review.findFirst({
            where: { projectId },
        });

        if (foundReview) {
            const reviewId = foundReview.id;

            // Use a transaction to ensure all deletions occur atomically
            await prisma.$transaction([
                prisma.zero.deleteMany({ where: { reviewId } }),
                prisma.one.deleteMany({ where: { reviewId } }),
                prisma.two.deleteMany({ where: { reviewId } }),
                prisma.three.deleteMany({ where: { reviewId } }),
                prisma.model.deleteMany({ where: { reviewId } }),
                prisma.final.deleteMany({ where: { reviewId } }),
                prisma.review.delete({ where: { id: reviewId } }),
            ]);
        }

        // Delete the project
        await prisma.project.delete({ where: { id: projectId } });

        return res.status(200).json({ msg: "Project deleted successfully" });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "An error occurred while deleting the project" });
    }
};


// export const updateReviewByProjectId = async (req, res) => {
//     const {staffId, projectId} = req.params;
//     const {stage} = req.query;
//
//     if (!stage) {
//         return res.status(400).json({error: 'Stage query parameter is required'});
//     }
//
//     const reviewFields = {
//         "zero": "reviewZero",
//         "one": "reviewOne",
//         "two": "reviewTwo",
//         "three": "reviewThree",
//         "model": "reviewModel",
//         "final": "reviewFinal"
//     };
//
//     const reviewModel = {
//         "zero": prisma.zero,
//         "one": prisma.one,
//         "two": prisma.two,
//         "three": prisma.three,
//         "model": prisma.model,
//         "final": prisma.final
//     };
//
//     const reviewField = reviewFields[stage];
//     const reviewModelInstance = reviewModel[stage];
//
//     if (!reviewField || !reviewModelInstance) {
//         return res.status(400).json({error: 'Invalid stage value'});
//     }
//
//     try {
//         // Check if the staff exists
//         const staffExists = await prisma.staff.findUnique({
//             where: {id: staffId}
//         });
//
//         if (!staffExists) {
//             return res.status(404).json({error: 'Staff not found'});
//         }
//
//         // Check if the review exists for the specified project, staff, and stage
//         const review = await prisma.review.findFirst({
//             where: {
//                 projectId: projectId,
//                 [reviewField]: {
//                     some: {
//                         stage: stage
//                     }
//                 }
//             },
//             select: {
//                 [reviewField]: {
//                     where: {
//                         stage: stage
//                     },
//                     select: {
//                         id: true
//                     }
//                 }
//             }
//         });
//
//         if (!review || review[reviewField].length === 0) {
//             return res.status(404).json({error: 'Review not found'});
//         }
//
//         const reviewId = review[reviewField][0].id;
//
//         // Update the nested review with the data from the request body
//         const updatedReview = await reviewModelInstance.update({
//             where: {
//                 id: reviewId
//             },
//             data: req.body
//         });
//
//         return res.json(updatedReview);
//     } catch (err) {
//         console.error('Error updating review:', err);
//         return res.status(500).json({error: 'Internal server error'});
//     }
// };


// import prisma from "../db.js";
// import logger from "../modules/logger.js";
//
// const MAX_STUDENTS_IN_PROJECT = 3;
// const MAX_PROJECT_COUNT = 13;
//
// export const registerProject = async (req, res) => {
//     try {
//         const { studentIds, staffId } = req.body;
//
//         if (!staffId) {
//             return res.status(400).json({ error: "Staff ID is required" });
//         }
//
//         // Check if the staff already has MAX_PROJECT_COUNT projects
//         const staffProjectsCount = await prisma.project.count({
//             where: {
//                 staffId: staffId,
//             },
//         });
//
//         if (staffProjectsCount >= MAX_PROJECT_COUNT) {
//             return res.status(400).json({ error: `Staff already has ${MAX_PROJECT_COUNT} projects` });
//         }
//
//         if (studentIds.length > MAX_STUDENTS_IN_PROJECT) {
//             return res.status(400).json({ error: `Only ${MAX_STUDENTS_IN_PROJECT} students are allowed per project` });
//         }
//
//         const foundStudentsResults = await Promise.allSettled(
//             studentIds.map(async (id) =>
//                 prisma.student.findFirst({
//                     where: { id },
//                 })
//             )
//         );
//
//         logger.debug(foundStudentsResults, "Found students from DB");
//
//         const foundStudents = foundStudentsResults.filter(result => result.status === "fulfilled").map(result => result.value);
//
//         if (foundStudents.length !== studentIds.length) {
//             return res.status(404).json({ error: "One or more students not found" });
//         }
//
//         // Check if any of the students are already part of a project
//         const existingStudentInProjects = await prisma.project.findMany({
//             where: {
//                 students: {
//                     some: {
//                         id: {
//                             in: studentIds,
//                         },
//                     },
//                 },
//             },
//             select: {
//                 students: {
//                     select: {
//                         id: true,
//                     },
//                 },
//             },
//         });
//
//         if (existingStudentInProjects.length > 0) {
//             return res.status(400).json({ error: "The selected student is already assigned to a project" });
//         }
//
//         const project = await prisma.project.create({
//             data: {
//                 title: req.body.title,
//                 students: {
//                     connect: studentIds.map((id) => ({ id })),
//                 },
//                 staff: {
//                     connect: { id: staffId },
//                 },
//             },
//         });
//
//         res.status(200).json({ project });
//     } catch (err) {
//         logger.error(err);
//         res.status(500).json({ error: err.message });
//     }
// };
