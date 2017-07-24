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
    fromFBJson: function (j) {
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

            //change user
            $(".user_photo").attr("src", user.photoURL);
            var name = user.displayName || user.email;
            $(".username").text(name);
            //naviate to main

            this.activateBoard();
        } else {
            console.log("No user is signed in.");
            //navigate to splash
            this.inactivateBoard();
        }
    },
    activateBoard: function () {
        const self = this;
        $('#splash').fadeOut(500);
        $('#board').fadeIn(500);
        firebase.database().ref("boards/" + this.boardId).once("value", snap => {
            self.boardInfo = snap.val();
            if (self.boardInfo) {
                //存在するボード
                self.boardView.attend(self.boardId, self.boardInfo, self.user);
            } else {
                bootbox.alert("No board exists.");
            }
        });
    },
    inactivateBoard: function () {
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

        //initialize canvas
        this.canvas = window.canvas = new fabric.Canvas("c", {
            isDrawingMode: false
        });

        //profile event listener
        $(".btn.signout").on("click", evt => {
            firebase.auth().signOut();
        })
        //Listen for palatte
        $(".btn.mode-select").on("click", evt => {
            self.setMode("select");
        });
        $(".btn.mode-draw").on("click", evt => {
            self.setMode("draw");
        });
        $(".btn.mode-text").on("click", evt => {
            self.setMode("text");
        });
        $(".btn.mode-stamp").on("click", evt => {
            self.setMode("stamp");
        });
        $(".btn.mode-pan").on("click", evt => {
            self.setMode("pan");
        });

        $(".btn.zoom-up").on("click", evt => {
            canvas.setZoom(canvas.getZoom() * 1.25);
        });
        $(".btn.zoom-down").on("click", evt => {
            canvas.setZoom(canvas.getZoom() * 0.75);
        });

        $(".btn.remove").on("click", evt => {
            let obj = canvas.getActiveObject();
            if (obj) {
                canvas.discardActiveObject();
                canvas.remove(obj);
            }
            let group = canvas.getActiveGroup();
            if (group) {
                for (obj of group.getObjects()) {
                    canvas.remove(obj);
                }
                canvas.discardActiveGroup();
                canvas.renderAll();
            }
        });

        //initialize canvas event
        var manager = window.hm = new Hammer.Manager($(".canvas-wrapper")[0]);
        manager.add(new Hammer.Tap({
            event: 'doubletap',
            taps: 2,
            threshold: 75,
            interval: 400,
            time: 600,
            posThreshold: 25
        }));
        manager.add(new Hammer.Press({
            event: 'press',
            time: 450
        }));
        var pan1Finger = new Hammer.Pan({
            event: 'pan1Finger',
            pointers: 1
        });
        manager.add(pan1Finger);
        var pinch = new Hammer.Pinch({
            event: 'pinch'
        });
        manager.add(pinch);
        manager.on("doubletap", function (ev) {
            console.log("%cdoubletap detected", "background: #1f656a; color: white;");
            canvas.selection = !canvas.selection;
            console.log("change selection  toggle", canvas.selection);
        });
        manager.on("press", function (ev) {
            console.log("press", ev);
            let srcEvt = ev.srcEvent;
        });

        var LOG = true;
        manager.on("pan1Fingerstart", function (ev) {
            if (!canvas.activePanningMode) {
                if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup()) {
                    if (LOG) {
                        console.log("STARTING pan1Finger");
                        console.log(ev);
                    }
                    canvas.pan1Fingerstarted = true;
                }
            } else if (!canvas.selection) {
                /********** PANNING **********/
                canvas.defaultCursor = "-webkit-grabbing";
                // This is to allow the canvas panning with one finger
                if (LOG) {
                    console.log("STARTING pan1Finger in PANNING MODE");
                    console.log(ev);
                }
                canvas.viewportLeft = canvas.viewportTransform[4];
                canvas.viewportTop = canvas.viewportTransform[5];
                // gestureSetEnabled(manager, 'pinch', false);
            } else if (!canvas.getActiveObject()) {
                console.log("Starting selection", canvas.selection);
            }
        });
        manager.on("pan1Fingermove", function (ev) {
            if (!canvas.activePanningMode) {
                if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup() && canvas.pan1Fingerstarted) {
                    if (LOG) {
                        console.log("MOVING pan1Finger");
                        console.log(ev);
                    }
                    if(["stamp"].indexOf(self.getMode()) !== -1 && canvas.__droppingObject){
                        // canvas.__stamping
                        let cp = new fabric.Point(ev.center.x, ev.center.y);
                        let ivp = fabric.util.invertTransform(canvas.viewportTransform)
                        let gp = fabric.util.transformPoint(cp, ivp);
                        canvas.__droppingObject.left = gp.x;
                        canvas.__droppingObject.top = gp.y;
                        canvas.renderAll();
                    }
                }
            } else if (!canvas.selection) {
                /********** PANNING **********/
                canvas.defaultCursor = "-webkit-grabbing";
                // This should only happen when the mouse event happens over a zone where NO objects are being touched
                if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup()) {
                    let x = -canvas.viewportLeft - ev.deltaX;
                    let y = -canvas.viewportTop - ev.deltaY;
                    canvas.absolutePan(new fabric.Point(x, y));
                }
            } else if (!canvas.getActiveObject()) {
                /********** SQUARE SELECTING **********/
                if (LOG) {
                    console.log("Selecting");
                }
            }
        });
        manager.on("pan1Fingerend", function (ev) {
            console.log("END pan1Finger");
            if (!canvas.activePanningMode && !canvas.isSamplingLineMode && !canvas.selection) {
                if (!canvas.isDrawingMode && !canvas.getActiveObject() && !canvas.getActiveGroup() && canvas.pan1Fingerstarted && !canvas.connectorsHidden) {

                    if(canvas.__droppingObject){
                        canvas.fire("object:modified", {target: canvas.__droppingObject});
                        delete canvas.__droppingObject;
                    }
                }
            } else if (!canvas.selection) {
                canvas.defaultCursor = "-webkit-grab";
            } else if (!canvas.getActiveObject()) {
                if (LOG) {
                    console.log("Square selection ended");
                }
            }
        });

        // ###################### PINCHING ###################### //
        manager.on("pinchstart", function (ev) {
            console.log("pinchstart");
            if (!canvas.getActiveObject() && !canvas.getActiveGroup()) {
                canvas.zoomBeforePanning = canvas.getZoom();
            }
        });
        manager.on("pinchmove", function (ev) {
            if (LOG) {
                console.log("%cpinchmove", "background: aqua");
                console.log(ev);
            }
            if (!canvas.getActiveObject() && !canvas.getActiveGroup()) {
                var center = new fabric.Point(ev.center.x, ev.center.y);
                canvas.zoomToPoint(center, canvas.zoomBeforePanning * ev.scale);
                canvas.renderAll();
            }
        });
        //#########################################

        self.stamps = {};
        //load stamp sprites(FontAwesome)
        fabric.loadSVGFromURL("/assets/sprites.svg", (paths) => {
            paths.forEach((n) => {
                n.scale(0.04);
            });
            self.sprites = paths;
        });

        self.stampNames = ["heart_1", "heart_2", "rabbit_apathy",
            "rabbit_blankly", "rabbit_good", "rabbit_oops", "rabbit_sad"
        ];
        self.stampNames.forEach(sname => {
            fabric.loadSVGFromURL("/assets/" + sname + ".svg", (paths) => {
                paths.forEach((n) => {
                    n.scale(0.1);
                    self.stamps[sname] = n;
                });
            });
        });
        // change window size
        window.addEventListener('resize', this.resizeCanvas, false);
        this.resizeCanvas();
    },
    attend: function (boardId, boardInfo, user) {
        firebase.database().ref("attndees/" + boardId + "/" + user.uid).once("value", function (snap) {
            this.attendee = snap.value
            if (this.attendee) {
                //already attend
                this.setUpCanvas(boardId);
            } else {
                // new attend
                let colorHash = new ColorHash();
                this.attendee = {
                    role: boardInfo.owner === user.uid ? "owner" : "member",
                    color: colorHash.hex(user.uid)
                }
                firebase.database().ref("attendees/" + boardId + "/" + user.uid).set(this.attendee);
                this.setUpCanvas(boardId);
            }
        }.bind(this));
    },

    setUpCanvas: function (boardId) {
        const self = this;
        this.cleanUpCanvas();
        //init data
        this.objectMap = {}

        // SetUp Attendee Color
        $(".palette").css({
            "background-color": this.attendee.color
        });
        $(".profile").css({
            "background-color": this.attendee.color
        });
        // Setup Brush
        this.canvas.freeDrawingBrush.color = this.attendee.color;

        // Setup Current Stamp
        self.currentStampIdx = 0;
        self.currentStamp = self.stamps[self.stampNames[self.currentStampIdx]];


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
                    if (self.attendee.role == "owner" || obj.createdBy === app.user.uid) {
                        obj.selectable = true;
                    } else {
                        obj.selectable = false;
                    }

                    self.objectMap[snap.key] = obj;
                    self.canvas.add(obj);
                });
            });
        });
        this.__listenRefs.push(objectsRef);

        objectsRef.on("child_changed", (snap, prevId) => {
            console.log("child_changed", snap, prevId);
            let key = snap.key;
            let prev = self.objectMap[key];
            let data = _.fromFBJson(snap.val());
            if (prev.version != data.version) {
                prev.set(data);
                canvas.renderAll();
            }
        });

        // Listen for canvas
        this.canvas.on("object:added", ev => {
            let target = ev.target;
            console.log("object:added", ev.target)
            if (!target.uuid) {
                //local追加したオブジェクト
                target.set({
                    "uuid": _.uuid(),
                    "createdBy": app.user.uid,
                    "version": 0
                });
                let data = target.toObject(["uuid", "createdBy", "version"]);
                let pushedRef = objectsRef.push();
                console.log("push objects", pushedRef.key, data);
                self.objectMap[pushedRef.key] = target;
                pushedRef.set(_.toFBJson(data));
            }
        });

        this.canvas.on("object:modified", ev => {
            let target = ev.target;

            function updateObject(target) {
                console.log("object:modified", target);

                if (target instanceof fabric.Group) {
                    //Groupの場合はobject単位に分割して更新する
                    for (subtarget of target.getObjects()) {
                        updateObject(subtarget);
                    }
                    return
                }
                target.set("version", 1 + (target.version || 0))
                let data = target.toObject(["uuid", "createdBy", "version"]);
                let key = _.findKey(self.objectMap, {
                    uuid: data.uuid
                });
                self.objectMap[key] = target;
                objectsRef.child(key).set(_.toFBJson(data));
            }
            updateObject(target);
        });
        this.canvas.on("object:removed", ev => {
            console.log("object:removed");

        });

        //mousedown
        this.canvas.on("mouse:down", ev => {
            console.log(ev);
            let srcEvt = ev.e;
            let viewportLeft = canvas.viewportTransform[4];
            let viewportTop = canvas.viewportTransform[5];
            let cx = srcEvt.clientX;
            let cy = srcEvt.clientY;
            let cp = new fabric.Point(cx, cy);
            let ivp = fabric.util.invertTransform(canvas.viewportTransform)
            let gp = fabric.util.transformPoint(cp, ivp);
            if (canvas.activeStampMode) {
                console.log("STAMP!");
                let n = self.currentStamp.clone();
                n.fill = self.attendee.color;
                n.left = gp.x;
                n.top = gp.y;
                canvas.__droppingObject = n;
                canvas.add(n);
            } else if (canvas.activeTextMode) {
                console.log("TEXT!!!");
                let n = new fabric.IText("Text", {
                    fill: self.attendee.color
                });
                n.left = gp.x;
                n.top = gp.y;
                canvas.add(n);
                canvas.setActiveObject(n);
            }
        });
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
    },

    getMode: function () {
        return this.currentMode;
    },

    setMode: function (mode) {
        const canvas = this.canvas;
        let previousMode = this.currentMode;
        switch (mode) {
            case "draW":
                canvas.selection = false;
                canvas.isDrawingMode = true;
                canvas.activePanningMode = false;
                canvas.activeTextMode = false;
                canvas.activeStampMode = false;
                break;
            case "text":
                canvas.defaultCursor = "text";
                canvas.selection = false;
                canvas.isDrawingMode = false;
                canvas.activePanningMode = false;
                canvas.activeTextMode = true;
                canvas.activeStampMode = false;
                break;
            case "stamp":
                canvas.defaultCursor = "cell";
                canvas.selection = false;
                canvas.isDrawingMode = false;
                canvas.activePanningMode = false;
                canvas.activeTextMode = false;
                canvas.activeStampMode = true;
                break;
            case "pan":
                canvas.defaultCursor = "-webkit-grab";
                canvas.selection = false;
                canvas.isDrawingMode = false;
                canvas.activePanningMode = true;
                canvas.activeTextMode = false;
                canvas.activeStampMode = false;
                break;
            case "select":
            default:
                //select mode
                mode = "select"
                canvas.defaultCursor = "auto"
                canvas.selection = true;
                canvas.isDrawingMode = false;
                canvas.activePanningMode = false;
                canvas.activeTextMode = false;
                canvas.activeStampMode = false;
        }
        this.currentMode = mode;
        console.log("canvas mode to " + this.currentMode);
    },

    /**
     * ツールボックスのアクティブスタンプを次に移動する
     */
    nextStamp: function () {
        self.currentStampIdx++;
        if (self.currentStampIdx >= self.stampNames.length) {
            self.currentStampIdx = 0;
        }
        self.currentStamp = self.stamps[self.stampNames[self.currentStampIdx]];

    },

});



/**
 * Initialize App
 */

const app = window.app = new raku.Router();
Backbone.history.start({
    pushState: true,
    root: '/'
});