const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const myarticles = new Schema({
    profileImage: {
        type: String,
        default: 'https://res.cloudinary.com/dymtrscmc/image/upload/v1731216917/4tUddEegT1GSwrn4mrueeg_m9jlw9.jpg'
    },
    elnasher: String,
    id: String,
    addressOfArticle: String,
    bodyOfArticle: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

//  { timestamps: true }

const Article = mongoose.model("article", myarticles);

// تصدير الموديل
module.exports = Article;
