var express           = require("express"),
    app               = express(),
    request           = require("request"),
    bodyParser        = require("body-parser"),
    mongoose          = require("mongoose"),
    passport          = require("passport"),
    LocalStrategy     = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    NewsAPI           = require('newsapi'),
    newsapi           = new NewsAPI('a4f6ef067df542f7a89754598c354849'),
    nodemailer        =   require("nodemailer"),
    transporter       =   nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"vjreddit@gmail.com",
        pass:"vjti@123"
    }
});

    //User Schema
    var userSchema = new mongoose.Schema({
      username:String,
      password: String,
      email:String,
      canPost:{type:Boolean,default:false }
    });
    userSchema.plugin(passportLocalMongoose);
    var User = mongoose.model("User" , userSchema);

    //Post Schema
    var postSchema = new mongoose.Schema({
      username:String,
      image:String,
      description:String
    })
    var Post = mongoose.model("Post",postSchema);

    //Post User
    var postuserSchema = new mongoose.Schema({
      username:String
    })
    var Postuser = mongoose.model("Postuser",postuserSchema);

    mongoose.connect("mongodb://localhost/VJReddit" , {useNewUrlParser:true});
    app.use(bodyParser.urlencoded({extended: true}));
    app.set("view engine", "ejs");
    app.use(express.static(__dirname + "/public"));



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

    app.get("/landing" , function(req,res)
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
    app.post("/newpost",isLoggedIn,function(req,res){
        var newPost = {
          username:req.user.username,
          image:req.body.image,
          description:req.body.description
        }
        Post.create(newPost,function(err,post){
          if(err){
            console.log(err.message);
          }else{
            res.redirect("/")
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

    app.get("/news" , function(req,res)
    {
      var searchObj;
      if(req.query.search){
          searchObj=req.query.search;
      }else{
          searchObj="technology"
      }
        newsapi.v2.everything({
            q: searchObj,
            pageSize:100
          }).then(response => {
            res.render("news" , {response:response,searchObj:searchObj});
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

    app.get("/" ,function(req,res){
      Post.find({},function(err,posts){
        if(err){
          console.log(err)
        }else{
          res.render("home",{posts:posts})
        }
      })
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
      successRedirect: "/",
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

    app.listen(8000,function()
    {
        console.log("YelpCamp Just started");
    });    