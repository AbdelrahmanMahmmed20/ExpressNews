const mongoose = require("mongoose");
const User = require("./authUser");
const Schema = mongoose.Schema;

const myarticles = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: User },
    id: String,
    addressOfArticle: String,
    bodyOfArticle: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

//  { timestamps: true }

const Article = mongoose.model("article", myarticles);

module.exports = Article;