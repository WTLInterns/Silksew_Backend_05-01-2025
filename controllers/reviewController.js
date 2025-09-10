const Review = require('../models/Review.js')

exports.addReview = async (req, res) => {
    try {
        const { userId, rating, review , name , productId} = req.body

        if (!userId || !rating || !review || !name || !productId) {
            res.status(400).json({ message: 'All fields are required' });
        }

        console.log(userId,
            rating,
            review,
            name,
            productId);

        const newReview = new Review({
            userId,
            rating,
            review,
            name,
            productId
        })

        await newReview.save();

        res.status(201).json({ message: 'Review Added successfully', user: newReview });


    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.getReview = async (req, res) => {
    try {
        
        const userReview = await Review.find()

        res.status(200).json({data:userReview})

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}