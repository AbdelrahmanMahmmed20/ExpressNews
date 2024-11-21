const express = require("express")
const app = express();
const mongoose = require("mongoose")
const port = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
const Articles = require("./models/myarticles")
const AuthUser = require("./models/authUser")
var moment = require("moment");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
var jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { check, validationResult } = require("express-validator");
app.use(express.json())
require('dotenv').config()

const multer  = require('multer')
const upload = multer({storage: multer.diskStorage({})});
const cloudinary = require('cloudinary').v2
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "torrent", (err) => {
            if (err) { res.redirect("/login"); } else { next(); }
        });
    } else {
        res.redirect("/login");
    }
};

const extractId = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'torrent', (err, decoded) => {
            if (err) {
                return res.redirect("/login");
            } else {
                const userId = decoded.id;
                req.userId = userId;
                next();
            }
        });
    } else {
        res.redirect("/login");
    }
}

const checkIfUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "torrent", async (err, decoded) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                const currentUser = await AuthUser.findById(decoded.id);
                res.locals.user = currentUser;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

app.get("*", checkIfUser);

app.post("*", checkIfUser);

app.get("/signout", (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
});

app.get("/home", requireAuth, extractId, (req, res) => {
    Articles.find()
        .populate('userId', 'username profileImage')
        .then((result) => {
            result.sort(() => Math.random() - 0.5);
            res.render("index", { arr: result, moment: moment, userId: req.userId });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/", (req, res) => {
    res.render("before");
});

/*
    get => لما تروح 
    post => اكشن معين هتعمله
*/

cloudinary.config({ 
    cloud_name: 'dymtrscmc', 
    api_key: '948651646782493', 
    api_secret: '04nf-t4qcY13nREQGBiDMuSQgXY'
});

app.post("/update-profile",requireAuth, upload.single('avator'),  function (req, res, next) {
    cloudinary.uploader.upload( req.file.path , async (error, result)=>{
        if(result)
        {
            var decoded = jwt.verify(req.cookies.jwt , "torrent")
            const avator = await AuthUser.updateOne({_id : decoded.id} , {profileImage : result.secure_url})
            res.redirect("/home")
        }
    });
})


app.get("/user/add", requireAuth, (req, res) => {
    res.render("user/add");
});

app.get("/login", (req, res) => {
    res.render("authUser/login");
});

app.get("/signup", (req, res) => {
    res.render("authUser/signup");
});

app.post("/signup",
    [
        check("email", "Please provide a valid email").isEmail(),
        check("password", "Password must be at least 8 characters with 1 upper case letter and 1 number").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
    ],
    async (req, res) => {
    try {
        const objError = validationResult(req);
        console.log(objError.errors);
        if (objError.errors.length > 0) {
            return res.json({ validationError: objError.errors });
        }
        const isCurrentEmail = await AuthUser.findOne({ email:  req.body.email    })
        console.log(isCurrentEmail)
        if (isCurrentEmail) {
            return res.json({ existEmail: "Email already exist" });
        }
        const newUser = await AuthUser.create(req.body);
        var token = jwt.sign({ id: newUser._id }, "torrent");
        res.cookie("jwt", token, { httpOnly: true, maxAge: 2592000000 });
        res.json({id:newUser._id});

    } catch (error) {
        console.log(error);
    }
});


app.post("/login", async (req, res) => {
    const loginUser = await AuthUser.findOne({ email: req.body.email });
    console.log(loginUser);

    if (loginUser == null) {
        res.json({ noEmailexist: "Email no exist , Try to signup" });
    } else {
        const match = await bcrypt.compare(req.body.password, loginUser.password);
        if (match) { // true
            var token = jwt.sign({ id: loginUser._id }, "torrent");
            res.cookie("jwt", token, { httpOnly: true, maxAge: 2592000000 });
            res.json({ id: loginUser._id });
        } else {
            res.json({wrongPassword : "Wrong Password"})
        }
    }
});


app.get("/forget_password", (req, res) => {
    res.render("authUser/forget_password");
});

// Post request for add articles
app.post("/user/add", requireAuth, extractId, (req, res) => {
    const articleData = {
        userId: req.userId,
        id: req.body.id,
        addressOfArticle: req.body.addressOfArticle,
        bodyOfArticle: req.body.bodyOfArticle,
    };

    Articles.create(articleData)
        .then(() => {
            res.redirect('/home');
        })
        .catch((err) => {
            console.log(err)
        });
});

app.use((req, res) => {
    res.render('user/404')
});

app.post("/user/update/:id", (req, res) => {
    console.log("Updating document with ID:", req.params.id);
    console.log("Request body:", req.body);

    Articles.updateOne({ _id: req.params.id }, req.body)
        .then(() => {
            console.log("Document updated successfully");
            res.redirect("/home");
        }).catch((err) => {
            console.log(err);
        });
});

app.get("/user/update/:id", requireAuth, extractId , (req, res) => {
    Articles.findById(req.params.id)
        .then((result) => {
            res.render("user/update", { obj: result, moment: moment , userId: req.userId});
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/user/view/:id", requireAuth, extractId , (req, res) => {
    const ID_USER = req.params.id; // req.params.id  ==>ID_USER

    Articles.findById(ID_USER)
    .then((result) => {
        res.render("user/view", { arr: result, moment: moment , userId: req.userId });
    }).catch((err) => {
        console.log(err);
    })
});

app.delete('/user/delete/:id', requireAuth, (req, res) => {
    Articles.deleteOne({ _id: req.params.id })
    .then((result) => {
        res.redirect("/home");
    });
})

app.post('/articles/:id/like', requireAuth, extractId, async (req, res) => {
    try {
        const article = await Articles.findById(req.params.id);
        if (!article.likes.includes(req.userId)) {
            article.likes.push(req.userId);  // إضافة ID المستخدم في اللايكات
            await article.save();
            res.json({ message: 'Like added', likesCount: article.likes.length });
        } else {
            res.json({ message: 'User already liked this article' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error adding like' });
    }
});

// Route للـ Unlike
app.post('/articles/:id/unlike', requireAuth, extractId, async (req, res) => {
    try {
        const article = await Articles.findById(req.params.id);
        if (article.likes.includes(req.userId)) {
            article.likes.pull(req.userId);  // إزالة ID المستخدم من اللايكات
            await article.save();
            res.json({ message: 'Like removed', likesCount: article.likes.length });
        } else {
            res.json({ message: 'User has not liked this article' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error removing like' });
    }
});

app.post('/update-username' , requireAuth, extractId, async (req , res) =>{
    var decoded = jwt.verify(req.cookies.jwt , "torrent")
    const username = await AuthUser.updateOne({_id: decoded.id} , {$set: { username: req.body.updateUser }})
    res.redirect('/home')
})

// mongoose.connect("mongodb+srv://norprogramming:Lv5X6F72yUSwlwkQ@cluster0.qxvw2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
//     .then(() => {
//         app.listen(port, () => {
//             console.log(`http://localhost:${port}/`);
//         });
//     })
//     .catch((err) => {
//         console.log(err);
//     })
mongoose.connect("mongodb://localhost:27017/ExpressNew")
    .then(() => {
        app.listen(port, () => {
            console.log(`http://localhost:${port}/`);
        });
    })
    .catch((err) => {
        console.log(err);
    })