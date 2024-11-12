const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const authUser = new Schema({
    username : String,
    email : String,
    password : String,
    profileImage : {
        type : String,
        default : "https://res.cloudinary.com/dymtrscmc/image/upload/v1731345164/re2p8oo1a8fguu09kwcf.jpg"
    }
},{ timestamps: true })

authUser.pre("save", async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("user", authUser);

// export the model
module.exports = User;