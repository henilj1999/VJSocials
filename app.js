var express           =     require("express"),
    app               =     express(),
    bodyParser        =     require("body-parser"),
    mongoose          =     require("mongoose"),
    paginate          =     require("mongoose-paginate"),
    passport          =     require("passport"),
    LocalStrategy     =     require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    NewsAPI           =     require('newsapi'),
    fs                =     require("fs"),
    newsapi           =     new NewsAPI('a4f6ef067df542f7a89754598c354849'),
    nodemailer        =     require("nodemailer"),
    transporter       =     nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"vjreddit@gmail.com",
        pass:"vjti@123"
    }
});

const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const API_KEY = "229255114692397";
const API_SECRET = "IfaEsihIsQW71ZBThvCBn-YS648";
const cloud = "di143nol9";

    //User Schema
    var userSchema = new mongoose.Schema({
      username:String,
      password: String,
      email:String,
      canPost:{type:Boolean,default:false }
    });
    userSchema.plugin(passportLocalMongoose);
    var User = mongoose.model("User" , userSchema);

    //Comments Schema
    var commentSchema = new mongoose.Schema({
      text:String,
      username:String
    })
    var Comment = mongoose.model("Comment",commentSchema)

    //Post Schema
    var postSchema = new mongoose.Schema({
      username:String,
      title:String,
      img:String,
      comments:[commentSchema],
      description:String
    })
    var Post = mongoose.model("Post",postSchema);

    //Post User
    var postuserSchema = new mongoose.Schema({
      username:String
    })
    var Postuser = mongoose.model("Postuser",postuserSchema);

    var newsSchema = new mongoose.Schema({
      image:String,
      title:String,
      description:String
    });
    newsSchema.plugin(paginate);

    var newsModel = mongoose.model("news" , newsSchema);

    mongoose.connect("mongodb://localhost/VJReddit" , {useNewUrlParser:true});
    app.use(bodyParser.urlencoded({extended: true}));
    app.set("view engine", "ejs");
    app.use(express.static(__dirname + "/public"));
    cloudinary.config({
      cloud_name: cloud,
      api_key: API_KEY,
      api_secret:API_SECRET
      });
      const storage = cloudinaryStorage({
      cloudinary: cloudinary,
      folder: "cloudinaryimages",
      allowedFormats: ["jpg", "png" , "jpeg"]
      });
      const parser = multer({ storage: storage });
    

// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next)
{
  res.locals.Cuser = req.user;
  next();
});

//===============
//ROUTES
//===============

    //New post routes

    app.get("/" , function(req,res)
    {
      res.render("landing");
    });
    app.get("/newpost",isLoggedIn,function(req,res){
      if(req.user.canPost){
        res.render("newpost");
      }
      else{
        res.render("canpost");
      }
      
    })
    app.post("/newpost",isLoggedIn,parser.single("image"),function(req,res){
        var newPost =
        {
         username : req.user.username,
         title: req.body.title,
         img : req.file.url,
         description : req.body.description
        }
        
        Post.create(newPost,function(err,post){
          
          if(err){
            console.log(err.message);
          }else{
            res.redirect("/post")
          }
        }) 
      })
      app.get("/user/verification/:id",isLoggedIn,function(req,res){ 
          if(req.user.id == req.params.id){
              var updatedUser = {
                canPost: true
              }
              User.findByIdAndUpdate(req.params.id,{$set:updatedUser},function(err,updateduser){
                if(err){
                  console.log(err);
                }else{
                  res.redirect("/")
                }
              })
          }
          else res.send("ERRROOOORRRR");  
      });


    app.get("/userpost",isLoggedIn,function(req,res){
      var mailOptions={
        from:"vjreddit@gmail.com",
        to: req.user.email,
        subject:"Verification",
        html:'<h1>You need to verify your email to post on VJReddit.</h1><h3>Click Below to verify</h3><a href="http://localhost:8000/user/verification/'+ req.user.id +'">Click</a>'
    }
    transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.log(error);
        }else{
            console.log("Email sent: " + info.response);
            res.redirect("/");
        }
    })
    })

    app.get("/news/:search/:page" , function(req,res)
    {
        newsapi.v2.everything({
            q: req.params.search,
            pageSize:8,
            page:req.params.page
          }).then(response => {
            res.render("news" , {response:response,search:req.params.search});
          });
    });
     app.get("/news/:searchObj/:id" , function(req,res)
    {
      var searchObj = req.params.searchObj;
      var i = req.params.id;
      newsapi.v2.everything({
        q: searchObj,
        pageSize:100
      }).then(response => {       
        res.render("show" , {response:response , i:i});
      });
    });
  

    app.get("/news/:searchObj/:id/:page" , function(req,res)
    {
      var searchObj = req.params.searchObj;
      var i = req.params.id;
      newsapi.v2.everything({
        q: searchObj,
        pageSize:8,
        page:req.params.page
      }).then(response => {       
        res.render("show" , {response:response , i:i});
      });
    });

    app.get("/post" ,function(req,res){
      Post.find({},function(err,posts){
        if(err){
          console.log(err)
        }else{
          res.render("home",{posts:posts})
        }
      })
    });

    app.post("/comments/:id",(req,res)=>{
      Post.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
            res.redirect("/post");
        } else {
          var Com = 
          {
            username : req.user,
            text : req.body.comment
          }
         Comment.create(Com, function(err, comment){
            if(err){
                console.log(err);
            } else {
                //add username and id to comment
               
                //save comment
                comment.save();
                post.comments.push(comment);
                post.save();
                console.log(comment);
                res.redirect('/post');
            }
         });
        }
    });
    });

    app.get("/register" , function(req,res)
    {
      res.render("register");
    })

    app.post("/register" , function(req,res)
    {
      var newUser = new User({username: req.body.username,email: req.body.email});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/"); 
        });
    });
    });

    app.get("/login",function(req,res)
    {
      res.render("login");
    });

    app.post("/login" , passport.authenticate("local",
    {
      successRedirect: "/post",
      failureRedirect: "/login"}),
        function(req,res){
        });

        app.get("/logout" , function(req,res){
          req.logout();
          res.redirect("/");
        });

    //MiddleWare

    function isLoggedIn(req,res,next){
      if(req.isAuthenticated()){
        next();
      }else{
        res.redirect("/login");
      }
    }

    app.listen(3000,function()
    {
        console.log("VJSocials Just started");
    });    