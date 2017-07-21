console.log("START APP");

/**
 * Utility Mixin
 */
_.mixin({
    uuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    toFBJson: function (j) {
        for (var i in j) {
            if (typeof j[i] === "object") {
                _.toFBJson(j[i]);
            }
            if (j[i] === null) {
                j[i] = "[null]";
            }
        }
        return j;
    },
    fromFBJson: function(j){
        for (var i in j) {
            if (typeof j[i] === "object") {
                _.fromFBJson(j[i]);
            }
            if (j[i] === "[null]") {
                j[i] = null;
            }
        }
        return j;
    }
});



const raku = {};

raku.Router = Backbone.Router.extend({
    routes: {
        "": "routeHome",
        "boards(/:id)": "routeBoard",
    },
    initialize: function () {
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
    routeHome: function () {
        console.log("routeHome", arguments);

    },
    routeBoard: function (boardId) {
        console.log("routeBoard", arguments);
        this.boardId = boardId;
    },

    handleSignInState: function (user) {
        this.user = user;
        if (user) {
            console.log("User is signed in.");
            //update user profile
            firebase.database().ref("users/" + user.uid).set({
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            });
            //naviate to main

            this.activateBoard();
        } else {
            console.log("No user is signed in.");
            //navigate to splash
            this.inactivateBoard();
        }
    },
    activateBoard: function(){
        const self = this;
        $('#splash').fadeOut(500);
        $('#board').fadeIn(500);
        firebase.database().ref("boards/"+this.boardId).once("value", snap=>{
            self.boardInfo = snap.val();
            if(self.boardInfo){
                //存在するボード
                self.boardView.attend(self.boardId, self.boardInfo, self.user);
            }else{
                bootbox.alert("No board exists.");
            }
        });
    },
    inactivateBoard: function(){
            $('#splash').fadeIn(500);
            $('#board').fadeOut(500);
            this.splashView.splash();
    }
});

raku.SplashView = Backbone.View.extend({
    el: "#splash",
    initialize: function (app) {
        const self = this;
        this.app = app;

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
    splash: function () {
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
            onReady: function () {
                segmenter.animate();
                headline.classList.remove('trigger-headline--hidden');
            },
            onAnimationComplete: function () {
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
    signIn: function (provider) {
        const self = this;
        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a GitHub Access Token. You can use it to access the GitHub API.
            const token = result.credential.accessToken;
            // The signed-in user info.
            const user = result.user;

        }).catch(function (error) {
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

    initialize: function (app) {
        const self = this;
        this.app = app;
        _.bindAll(this, "resizeCanvas");

        this.objectMap = {};
        this.__listenRefs = [];

        this.canvas = new fabric.Canvas("c", {
            isDrawingMode: true
        });

        //load stamp sprites(FontAwesome)
        fabric.loadSVGFromURL("/assets/sprites.svg", (paths) => {
            paths.forEach((n) => {
                n.scale(0.04);
            });
            self.sprites = paths;
        });
        // change window size
        window.addEventListener('resize', this.resizeCanvas, false);
        this.resizeCanvas();
    },
    attend: function(boardId, boardInfo, user){
        firebase.database().ref("attndees/" + boardId + "/" + user.uid).once("value", function(snap){
            this.attendee = snap.value
            if(this.attendee){
                //already attend
                this.setUpCanvas(boardId);
            }else{
                // new attend
                let colorHash = new ColorHash();
                this.attendee = {
                    role: boardInfo.owner === user.uid ? "owner" : "member",
                    color: colorHash.hex(user.uid)
                }
                firebase.database().ref("attendees/"+boardId + "/" + user.uid).set(this.attendee);
                this.setUpCanvas(boardId);
            }
        }.bind(this));
    },
    setUpCanvas: function (boardId) {
        const self = this;
        this.cleanUpCanvas();
        //init data
        this.objectMap = {}

        // Setup Brush
        this.canvas.freeDrawingBrush.color = this.attendee.color;
        // Listen firebase Event
        const canvasRef = firebase.database().ref("canvases/" + boardId);
        this.__listenRefs.push(canvasRef);
        const objectsRef = firebase.database().ref("objects/" + boardId);
        objectsRef.on("child_added", (snap, prevId) => {
            console.log("child_added", snap.key, snap.val(), prevId);
            const data = _.fromFBJson(snap.val());
            const key = snap.key;
            //すでにオブジェクトマップにある場合
            if (key in self.objectMap) return;
            fabric.util.enlivenObjects([data], objects => {
                objects.forEach(obj => {
                    if(self.attendee.role == "owner"||obj.createdBy === app.user.uid){
                        obj.selectable = true;
                    }else{
                        obj.selectable = false;
                    }

                    self.objectMap[snap.key] = obj;
                    self.canvas.add(obj);
                });
            });
        });
        this.__listenRefs.push(objectsRef);

        // Listen for canvas
        this.canvas.on("object:added", ev => {
            let target = ev.target;
            console.log("object:added", ev.target)
            if (!target.uuid) {
                //local追加したオブジェクト
                target.set({
                    "uuid": _.uuid(),
                    "createdBy": app.user.uid
                });
                let data = target.toObject(["uuid", "createdBy"]);
                let pushedRef = objectsRef.push();
                console.log("push objects", pushedRef.key, data);
                self.objectMap[pushedRef.key] = target;
                pushedRef.set(_.toFBJson(data));
            }
        });

        // this.canvas.on("object:modified", ev=>{V

        // });
    },

    cleanUpCanvas: function () {
        this.objectMap = {};
        this.canvas.off();
        this.canvas.clear(); //no fire events
        this.__listenRefs.forEach(ref => {
            ref.off();
        });
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
Backbone.history.start({pushState: true, root: '/'});