import prisma from "../db.js";
import logger from "../modules/logger.js";

export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params
        const { stage } = req.query;

        if (!stage) {
            return res.status(400).json({ error: "Stage query parameter is required" });
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
            return res.status(400).json({ error: "Invalid stage value" });
        }

        const reviews = await prisma.review.findFirst({
            where: { id: reviewId },
            include: {
                reviewZero: true,
                reviewOne: true,
                reviewTwo: true,
                reviewThree: true,
                reviewModel: true,
                reviewFinal: true
            }
        });

        if (!reviews || !reviews[reviewField] || reviews[reviewField].length === 0) {
            return res.status(404).json({ error: 'Review stage not found' });
        }

        const stageReviewId = reviews[reviewField][0].id;

        const updateFunctions = {
            "zero": prisma.zero.update,
            "one": prisma.one.update,
            "two": prisma.two.update,
            "three": prisma.three.update,
            "model": prisma.model.update,
            "final": prisma.final.update
        };

        const updateData = await updateFunctions[stage]({
            where: { id: stageReviewId },
            data: req.body
        });

        return res.status(200).json({ updateData, message: `review ${stage}  updated successfully` });
    } catch (err) {
        console.error('Error updating review:', err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// export const updateReview = async (req, res) => {
//     try {
//         const { reviewId } = req.params
//         const {stage} = req.query
//
//         if (!stage) {
//             return res.status(400).json({ error: "Stage query parameter is required" });
//         }
//
//         const reviews = await prisma.review.findFirst({
//             where: {
//                 id: reviewId
//             },
//             include: {
//                 reviewZero: true,
//                 reviewOne: true,
//                 reviewTwo: true,
//                 reviewThree: true,
//                 reviewModel: true,
//                 reviewFinal: true
//             }
//         })
//
//         logger.info(reviews)
//
//         const reviewZeroId = reviews.reviewZero[0].id
//
//         logger.info(reviewZeroId+ ">>>0000")
//
//         const reviewOneId = reviews.reviewOne[0].id
//         const reviewTwoId = reviews.reviewTwo[0].id
//         const reviewThreeId = reviews.reviewThree[0].id
//         const reviewModelId = reviews.reviewModel[0].id
//         const reviewFinalId = reviews.reviewFinal[0].id
//
//         let newData
//
//         switch(stage) {
//             case "zero":
//                 newData = await prisma.zero.update({
//                     where: {
//                         id: reviewZeroId
//                     },
//                     data: req.body
//                 })
//
//                 return res.status(200).json({newData, msg: 'reviewZero updated successfully'})
//
//             case "one":
//                 newData = await prisma.one.update({
//                     where: {
//                         id: reviewOneId
//                     },
//                     data: req.body
//                 })
//
//                 return res.status(200).json({newData, msg: 'reviewOne updated successfully'})
//         }
//
//         // return res.json({reviewZeroId, reviewOneId, reviewTwoId, reviewThreeId, reviewModelId, reviewFinalId})
//
//         // return res.status(200).json({reviewZero: reviews.reviewZero[0].id, reviewOne: reviews.reviewOne})
//
//     } catch (err) {
//         logger.error(err);
//         return res.status(500).json({error: "Internal Server Error"});
//     }
// }
