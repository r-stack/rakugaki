console.log("START APP");





const raku = {};

raku.Router = Backbone.Router.extend({
    routes: {
        "": "routeHome",
        ".*": "routeBoard",
    },
    initialize: function() {
        _.bindAll(this, "handleSignInState");

        // initialize views
        this.splashView = new raku.SplashView(this);
        this.boardView = new raku.BoardView(this);

        // inithailize global handler
        // change signin state
        firebase.auth().onAuthStateChanged(this.handleSignInState);

        //splash start
        this.splashView.splash();
    },
    routeHome: function() {
        console.log("routeHome", arguments);

    },
    routeBoard: function() {
        console.log("routeBoard", arguments);
    },

    handleSignInState: function(user) {
        this.user = user;
        if (user) {
            console.log("User is signed in.");
            //naviate to main
            $('#splash').fadeOut(500);
            $('#board').fadeIn(500);
        } else {
            console.log("No user is signed in.");
            //navigate to splash

            $('#splash').fadeIn(500);
            $('#board').fadeOut(500);
            this.splashView.splash();
        }
    } 
});

raku.SplashView = Backbone.View.extend({
    el: "#splash",
    initialize: function() {
        const self = this;
        this.$(".signInPane").on("click", "a.btn-github", (evt) => {
            const provider = new firebase.auth.GithubAuthProvider();
            self.signIn(provider);
        });
        this.$(".signInPane").on("click", "a.btn-google", (evt) => {
            const provider = new firebase.auth.GoogleAuthProvider();
            self.signIn(provider);
        });
        this.$(".signInPane").on("click", "a.btn-twitter", (evt) => {
            const provider = new firebase.auth.TwitterAuthProvider();
            self.signIn(provider);
        });
        this.$(".signInPane").on("click", "a.btn-facebook", (evt) => {
            const provider = new firebase.auth.FacebookAuthProvider();
            self.signIn(provider);
        });
    },
    splash: function(){
        const headline = document.querySelector('.trigger-headline');
        const segmenter = window.seg = new Segmenter(document.querySelector('.segmenter'), {
            pieces: 9,
            positions: [{
                    top: 30,
                    left: 5,
                    width: 40,
                    height: 80
                },
                {
                    top: 50,
                    left: 25,
                    width: 30,
                    height: 30
                },
                {
                    top: 5,
                    left: 75,
                    width: 40,
                    height: 20
                },
                {
                    top: 30,
                    left: 45,
                    width: 40,
                    height: 20
                },
                {
                    top: 45,
                    left: 15,
                    width: 50,
                    height: 40
                },
                {
                    top: 10,
                    left: 40,
                    width: 10,
                    height: 20
                },
                {
                    top: 20,
                    left: 50,
                    width: 30,
                    height: 70
                },
                {
                    top: 0,
                    left: 10,
                    width: 50,
                    height: 60
                },
                {
                    top: 70,
                    left: 40,
                    width: 30,
                    height: 30
                }
            ],
            animation: {
                duration: 2000,
                easing: 'easeInOutCubic',
                delay: 0,
                opacity: 1,
                translateZ: 85,
                translateX: {
                    min: -20,
                    max: 20
                },
                translateY: {
                    min: -20,
                    max: 20
                }
            },
            parallax: true,
            parallaxMovement: {
                min: -10,
                max: -5
            },
            onReady: function() {
                segmenter.animate();
                headline.classList.remove('trigger-headline--hidden');
            },
            onAnimationComplete: function() {
                if (firebase.auth().currentUser) {
                    //logined
                    // setTimeout(() => {
                    //     $('#splash').fadeOut(500);
                    //     $('#board').fadeIn(500);
                    // }, 1000);
                } else {
                    $(".signInPane").fadeIn();
                }
                return;

            }
        });
    },

     //sign in event
    signIn: function(provider) {
        const self = this;
        firebase.auth().signInWithPopup(provider).then(function(result) {
            // This gives you a GitHub Access Token. You can use it to access the GitHub API.
            const token = result.credential.accessToken;
            // The signed-in user info.
            const user = result.user;

        }).catch(function(error) {
            console.log(error);
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            const credential = error.credential;
            bootbox.alert(`Oops! Sign in Error: ${errorMessage}`);
        });
    }
});

raku.BoardView = Backbone.View.extend({

    initialize: function(){
        const self = this;
        _.bindAll(this, "resizeCanvas");

        this.canvas = new fabric.Canvas("c", {
            isDrawingMode: true
        });

        //load stamp sprites(FontAwesome)
        fabric.loadSVGFromURL("/assets/sprites.svg", (paths)=>{
            paths.forEach((n)=>{
                n.scale(0.04);
            });
            self.sprites = paths;
        });
        // change window size
        window.addEventListener('resize', this.resizeCanvas, false);
        this.resizeCanvas();
    },

    resizeCanvas: function () {
        this.canvas.setHeight(window.innerHeight);
        this.canvas.setWidth(window.innerWidth);
        this.canvas.renderAll();
    }
});



/**
 * Initialize App
 */

const app = window.app = new raku.Router();
Backbone.history.start();
 