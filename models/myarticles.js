const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const myarticles = new Schema({
    profileImage: String,
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
