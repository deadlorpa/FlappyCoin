window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

//sounds

var time;
var count_cl;
var hash;
var exponenta=1;
var hashsum=0;
var gamespeed = 3    // скорость игры
var pipespace = 50;   // 1/2 расстояния между верхней и нижней трубой
var morebotton = 0;   // добавочная величина, чтобы закрыть промежуток между трубами при pipespace=0
var pipeinterval = 180; // интервал между трубами
var soundJump = new Audio("/game/media/wing.ogg");
var soundScore = new Audio("/game/media/point.ogg");
var soundHit = new Audio("/game/media/hit.ogg");
var soundDie = new Audio("/game/media/die.ogg");
var soundSwoosh = new Audio("/game/media/swooshing.ogg");
var egg = new Audio("/game/media/die_egg.ogg");
//http://www.storiesinflight.com/html5/audio.html
var channel_max = 10; // number of channels
audiochannels = new Array();
for (a = 0; a < channel_max; a++) { // prepare the channels
    audiochannels[a] = new Array();
    audiochannels[a]['channel'] = new Audio(); // create a new audio object
    audiochannels[a]['finished'] = -1; // expected end time for this channel
}

function play_sound(s) {
    for (a = 0; a < audiochannels.length; a++) {
        thistime = new Date();
        if (audiochannels[a]['finished'] < thistime.getTime()) { // is this channel finished?
            audiochannels[a]['finished'] = thistime.getTime() + s.duration * 1000;
            audiochannels[a]['channel'].src = s.src;
            audiochannels[a]['channel'].load();
            audiochannels[a]['channel'].play();
            break;
        }
    }
}

function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "";
}

function setCookie(cname,cvalue,exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

// namespace our game
var FB = {
    // set up some inital values
    WIDTH: 320,
    HEIGHT: 480,
    scale: 1,
    // the position of the canvas
    // in relation to the screen
    offset: {
        top: 0,
        left: 0
    },
    // store all bird, touches, pipes etc
    entities: [],
    currentWidth: null,
    currentHeight: null,
    canvas: null,
    ctx: null,
    score: {
        taps: 0,
        coins: 0
    },
    distance: 0,
    digits:[],
    fonts:[],
    // we'll set the rest of these
    // in the init function
    RATIO: null,
    bg_grad: "day",
    game:null,
    currentWidth: null,
    currentHeight: null,
    canvas: null,
    ctx: null,
    ua: null,
    android: null,
    ios: null,
    gradients: {},
    init: function () {
        var grad;
        // the proportion of width to height
        FB.RATIO = FB.WIDTH / FB.HEIGHT;
        // these will change when the screen is resize
        FB.currentWidth = FB.WIDTH;
        FB.currentHeight = FB.HEIGHT;
        // this is our canvas element
        FB.canvas = document.getElementsByTagName('canvas')[0];
        // it's important to set this
        // otherwise the browser will
        // default to 320x200
        FB.canvas.width = FB.WIDTH;
        FB.canvas.height = FB.HEIGHT;
        // the canvas context allows us to
        // interact with the canvas api
        FB.ctx = FB.canvas.getContext('2d');
        // we need to sniff out android & ios
        // so we can hide the address bar in
        // our resize function
        FB.ua = navigator.userAgent.toLowerCase();
        FB.android = FB.ua.indexOf('android') > -1 ? true : false;
        FB.ios = (FB.ua.indexOf('iphone') > -1 || FB.ua.indexOf('ipad') > -1) ? true : false;

        setCookie("hash","0")
        setCookie("hashlast","0")
        setCookie("lastscore", "0")

        // setup some gradients
        grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
        grad.addColorStop(0, '#036');
        grad.addColorStop(0.5, '#69a');
        grad.addColorStop(1, 'yellow');
        FB.gradients.dawn = grad;

        grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
        grad.addColorStop(0, '#5dc2ca');
        grad.addColorStop(0.5, '#e9fcd9');
        grad.addColorStop(1, '#e9fcd9');
        FB.gradients.day = grad;

        grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
        grad.addColorStop(0, '#036');
        grad.addColorStop(0.3, '#69a');
        grad.addColorStop(1, 'pink');
        FB.gradients.dusk = grad;

        grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
        grad.addColorStop(0, '#036');
        grad.addColorStop(1, 'black');
        FB.gradients.night = grad;

        // listen for clicks
        FB.canvas.addEventListener('click', function (e) {
            e.preventDefault();
            FB.Input.set(e);
        }, false);

        // listen for space and enter
        window.addEventListener('keydown', function (e) {
            if (e.which != 0) { // все кроме IE
                if (e.which == 32){
                    e.preventDefault();
                    FB.Input.set(e);
                }
                if (e.which ==13){
                    e.preventDefault();
                    FB.Input.set(e);
                }
            }// спец. символ
        }, false);

        // listen for touches
        window.addEventListener('touchstart', function (e) {
            e.preventDefault();
            // the event object has an array
            // called touches, we just want
            // the first touch
            FB.Input.set(e.touches[0]);
        }, false);
        window.addEventListener('touchmove', function (e) {
            // we're not interested in this
            // but prevent default behaviour
            // so the screen doesn't scroll
            // or zoom
            e.preventDefault();
        }, false);
        window.addEventListener('touchend', function (e) {
            // as above
            e.preventDefault();
        }, false);

        // we're ready to resize
        FB.resize();
        FB.changeState("Splash");

        FB.loop();

    },

    resize: function () {

        FB.currentHeight = window.innerHeight;
        // resize the width in proportion
        // to the new height
        FB.currentWidth = FB.currentHeight * FB.RATIO;

        // this will create some extra space on the
        // page, allowing us to scroll pass
        // the address bar, and thus hide it.
        if (FB.android || FB.ios) {
            document.body.style.height = (window.innerHeight + 50) + 'px';
        }

        // set the new canvas style width & height
        // note: our canvas is still 320x480 but
        // we're essentially scaling it with CSS
        FB.canvas.style.width = FB.currentWidth + 'px';
        FB.canvas.style.height = FB.currentHeight + 'px';

        // the amount by which the css resized canvas
        // is different to the actual (480x320) size.
        FB.scale = FB.currentWidth / FB.WIDTH;
        // position of canvas in relation to
        // the screen
        FB.offset.top = FB.canvas.offsetTop;
        FB.offset.left = FB.canvas.offsetLeft;

        // we use a timeout here as some mobile
        // browsers won't scroll if there is not
        // a small delay
        window.setTimeout(function () {
            window.scrollTo(0, 1);
        }, 1);
    },

    // this is where all entities will be moved
    // and checked for collisions etc
    update: function () {
        FB.game.update();
        FB.Input.tapped = false;
    },

    // this is where we draw all the entities
    render: function () {

        if(FB.ios)
            FB.Draw.rect(0,0,400,400,FB.gradients.day)
        else
        { var city = new Image();
        city.src = "/game/media/bg1.png";
        FB.Draw.Image(city, 0, 0);}
        // cycle through all entities and render to canvas
        for (i = 0; i < FB.entities.length; i += 1) {
            FB.entities[i].render();
        }

        FB.game.render();

    },

    // the actual loop
    // requests animation frame
    // then proceeds to update
    // and render
    loop: function () {

        requestAnimFrame(FB.loop);

        FB.update();
        FB.render();
    },
    changeState: function(state) {
        FB.game = new window[state]();
        FB.game.init();
    }
};

// abstracts various canvas operations into
// standalone functions
FB.Draw = {

    clear: function () {
        FB.ctx.clearRect(0, 0, FB.WIDTH, FB.HEIGHT);
    },
    srect:function (x, y, w, h, col) {
        FB.ctx.strokeStyle = col;
        FB.ctx.strokeRect(x, y, w, h);
    },
    rect: function (x, y, w, h, col) {
        FB.ctx.fillStyle = col;
        FB.ctx.fillRect(x, y, w, h);
    },
    circle: function (x, y, r, col) {
        FB.ctx.fillStyle = col;
        FB.ctx.beginPath();
        FB.ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2, true);
        FB.ctx.closePath();
        FB.ctx.fill();
    },
    Image:function(img,x,y){
        FB.ctx.drawImage(img,x,y);
    },
    Sprite: function (img, srcX, srcY, srcW, srcH, destX, destY, destW, destH, r) {
        FB.ctx.save();
        FB.ctx.translate(destX, destY);
        FB.ctx.rotate(r * (Math.PI / 180));
        FB.ctx.translate(-(destX + destW / 2), -(destY + destH / 2));
        FB.ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
        FB.ctx.restore();
    },
    semiCircle: function (x, y, r, col) {
        FB.ctx.fillStyle = col;
        FB.ctx.beginPath();
        FB.ctx.arc(x, y, r, 0, Math.PI, false);
        FB.ctx.closePath();
        FB.ctx.fill();
    },

    text: function (string, x, y, size, col) {
        FB.ctx.font = 'bold ' + size + 'px Monospace';
        FB.ctx.fillStyle = col;
        FB.ctx.fillText(string, x, y);
    }

};

FB.Input = {

    key: 0,
    x: 0,
    y: 0,
    tapped: false,

    set: function (data) {
        this.key = data.which;
        this.x = (data.pageX - FB.offset.left) / FB.scale;
        this.y = (data.pageY - FB.offset.top) / FB.scale;
        this.tapped = true;

    }

};

FB.Cloud = function (x, y) {

    this.x = x;
    this.y = y;
    this.r = 30;
    this.col = 'rgba(255,255,255,1)';
    this.type = 'cloud';
    // random values so particles do no
    // travel at the same speeds
    this.vx = -1;

    this.remove = false;

    this.update = function () {

        // update coordinates
        this.x += this.vx;
        if (this.x < (0 - 115)) {
            this.respawn();
        }

    };


    this.render = function () {

        FB.Draw.circle(this.x + this.r, (this.y + this.r), this.r, this.col);
        FB.Draw.circle(this.x + 55, (this.y + this.r / 2), this.r / 0.88, this.col);
        FB.Draw.circle(this.x + 55, (this.y + this.r + 15), this.r, this.col);
        FB.Draw.circle(this.x + 85, (this.y + this.r), this.r, this.col);


    };

    this.respawn = function () {

        this.x = ~~ (Math.random() * this.r * 2) + FB.WIDTH;
        this.y = ~~ (Math.random() * FB.HEIGHT / 2)


    };

};

FB.BottomBar = function (x, y, r) {

    this.banner = new Image();
    this.banner.src = "/game/media/spr_earth.png";
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = -gamespeed;
    this.name = 'BottomBar';

    this.update = function () {
        // update coordinates
        this.x += this.vx;
        if (this.x < (0 - this.r)) {
            this.respawn();
        }
    };

    this.render = function () {
        for (var i = 0; i < 24; i++)
        FB.Draw.Image(this.banner, this.x+i*24, this.y);
    }

    this.respawn = function () {
        this.x = this.x+216;
    }

}

FB.Tree = function (x, y) {

    this.x = x;
    this.y = y
    this.r = 30;
    this.h = 50;
    this.w = this.r * 2;
    this.vx = -1.4;
    this.type = 'Tree';

    this.update = function () {
        // update coordinates
        this.x += this.vx;
        if (this.x < (0 - this.r * 2)) {
            this.respawn();
        }
    };

    this.render = function () {

        //FB.Draw.rect(this.x, this.y, this.w, this.h, '#c20');
        FB.Draw.circle(this.x + this.r, (this.y + this.r) - 10, this.r,'#4f943e');
        FB.Draw.circle(this.x + (this.r / 2), (this.y + this.r) - 10, this.r / 3, 'rgba(0,0,0,0.08)');
        FB.Draw.rect(this.x + this.r, this.y + this.r, 10, this.r, '#54412c');
    }

    this.respawn = function () {
        this.x = FB.WIDTH + this.r;
    }


}

FB.Pipe = function (x, w) {

    this.centerX = x;
    this.coin = true
    this.w = w;
    this.h = FB.HEIGHT - 150;
    this.vx = -gamespeed;
    this.type = 'pipe';


    this.update = function () {

        // update coordinates
        this.centerX += this.vx;
        if (this.centerX < (0 - this.w)) {
            this.respawn();
        }
    };

    this.render = function () {

        if (this.coin) {
            FB.Draw.circle(this.centerX + this.w / 2 - 5, this.centerY - 5, 5, "Gold")
        }
        grad = FB.ctx.createLinearGradient(this.centerX, this.centerY + 50, this.centerX +50, this.centerY+50);
        grad.addColorStop(0, '#58d858');
        grad.addColorStop(0.25, '#9ce659');
        grad.addColorStop(1, '#58d858');

        FB.Draw.rect(this.centerX, 0, this.w, this.centerY - pipespace, grad);
        FB.Draw.srect(this.centerX, 0, this.w, this.centerY - pipespace ,'#543847');
        FB.Draw.rect(this.centerX, this.centerY + pipespace, this.w, this.h - this.centerY+morebotton, grad);
        FB.Draw.srect(this.centerX, this.centerY + pipespace, this.w, this.h - this.centerY+morebotton, '#543847');

    }

    this.respawn = function () {
        this.centerY = this.randomIntFromInterval(70, 220);
        this.centerX = pipeinterval*3+pipeinterval/2+pipeinterval/4;
        if(pipespace==0)
            this.coin = false;
        else
            this.coin = true;
    }

    this.randomIntFromInterval = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    this.centerY = this.randomIntFromInterval(70, 220);
}

FB.Bird = function () {

    this.img = new Image();
    this.img.src = '/game/media/bird2.png';
    this.gravity = 0.35;
    this.width = 34;
    this.height = 24;
    this.ix = 0;
    this.iy = 0;
    this.fr = 0;
    this.vy = 200;
    this.vx = 150;
    this.velocity = 0;
    this.play = true;
    this.jump = -5.0;
    this.rotation = 0;
    this.type = 'bird';
    this.update = function () {
        if (this.fr++ > 5) {
            this.fr = 0;
            if (this.iy == this.height * 3) {
                this.iy = 0
            }
            this.iy += this.height;
        }
        if (this.play) {
            this.velocity += this.gravity;
            this.vy += this.velocity;
            if (this.vy <= 0) {
                this.vy = 0;
            }
            if (this.vy >= 370) {
                this.vy = 370;
            }
            this.rotation = Math.min((this.velocity / 10) * 90, 90);
        }
        if (FB.Input.tapped) {
            this.play = true;
            play_sound(soundJump);
            this.velocity = this.jump;
        }
    };

    this.render = function () {

        FB.Draw.Sprite(this.img, this.ix, this.iy, this.width, this.height, this.vx, this.vy, this.width, this.height, this.rotation);
    }

}

FB.Particle = function (x, y, r, col, type) {

    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;
    this.type = type || 'circle';
    this.name = 'particle';

    // determines whether particle will
    // travel to the right of left
    // 50% chance of either happening
    this.dir = (Math.random() * 2 > 1) ? 1 : -1;

    // random values so particles do no
    // travel at the same speeds
    this.vx = ~~ (Math.random() * 4) * this.dir;
    this.vy = ~~ (Math.random() * 7);

    this.remove = false;

    this.update = function () {

        // update coordinates
        this.x += this.vx;
        this.y -= this.vy;

        // increase velocity so particle
        // accelerates off screen
        this.vx *= 0.99;
        this.vy *= 0.99;

        // adding this negative amount to the
        // y velocity exerts an upward pull on
        // the particle, as if drawn to the
        // surface
        this.vy -= 0.35;

        // offscreen
        if (this.y > FB.HEIGHT) {
            this.remove = true;
        }

    };


    this.render = function () {
        if (this.type === 'star') {
            FB.Draw.star(this.x, this.y, this.col);
        } else {
            FB.Draw.circle(this.x, this.y, this.r, this.col);
        }
    };

};

// checks if two entities are touching
FB.Collides = function (bird, pipe) {

    if(bird.vy >=370){

        return true;
    }
    if (pipe.coin && bird.vx > pipe.centerX + pipe.w / 2 - 5) {
        pipe.coin = false;
        FB.score.coins += 1;
        exponenta=exponenta*hash;
        hashsum= hashsum + exponenta*FB.score.coins;
        FB.digits = FB.score.coins.toString().split('');
        play_sound(soundScore);
    }

    var bx1 = bird.vx - bird.width /2;
    var by1 = bird.vy - bird.height / 2;
    var bx2 = bird.vx + bird.width /2;
    var by2 = bird.vy + bird.height / 2;

    var upx1 = pipe.centerX;
    var upy1 = 0-morebotton;
    var upx2 = pipe.centerX + pipe.w;
    var upy2 = pipe.centerY - 50+morebotton;


    var lpx1 = pipe.centerX;
    var lpy1 = pipe.centerY + 50;
    var lpx2 = upx2;
    var lpy2 = pipe.h;

    var c1 = !(bx1 > upx2 ||
        bx2 < upx1 ||
        by1 > upy2 ||
        by2 < upy1)
    var c2 = !(bx1 > lpx2 ||
        bx2 < lpx1 ||
        by1 > lpy2 ||
        by2 < lpy1)

    return (c1 || c2)

};

window.Splash = function(){

    this.banner = new Image();
    this.banner.src = "/game/media/splash.png";

    this.init = function(){
        play_sound(soundSwoosh);
        FB.distance = 0;
        FB.bg_grad = "day";
        FB.entities = [];
        FB.score.taps = FB.score.coins = 0;
        //Add entities
        FB.entities.push(new FB.Cloud(30, ~~ (Math.random() * FB.HEIGHT / 2)));
        FB.entities.push(new FB.Cloud(130, ~~ (Math.random() * FB.HEIGHT / 2)));
        FB.entities.push(new FB.Cloud(230, ~~ (Math.random() * FB.HEIGHT / 2)));
        for (i = 0; i < 2; i += 1) {
            FB.entities.push(new FB.BottomBar(0 * i*240, FB.HEIGHT - 100, 216));
        }
        //FB.entities.push(new FB.Tree(~~(Math.random() * FB.WIDTH), FB.HEIGHT - 160));
       // FB.entities.push(new FB.Tree(~~(Math.random() * FB.WIDTH + 50), FB.HEIGHT - 160));
       // FB.entities.push(new FB.Tree(~~(Math.random() * FB.WIDTH + 100), FB.HEIGHT - 160));
    }

    this.update = function(){
        for (i = 0; i < FB.entities.length; i += 1) {
            FB.entities[i].update();
        }
        if (FB.Input.tapped) {
            FB.changeState('Play');
            FB.Input.tapped = false;
        }
    }

    this.render = function(){
        FB.Draw.Image(this.banner,66,100);
    }

}

window.Play = function(){
    hash=Math.floor(Math.random() * 10000000)+2;
    setCookie('hash',CryptoJS.AES.encrypt(hash.toString(),'gimmmethefuckingkey5y0u'),1);
    exponenta=1;
    hashsum=0;
    morebotton=0
    count_cl=0
    pipespace=50
    time=performance.now();
    this.init = function(){

        for(var i=0; i<4;i++)
        FB.entities.push(new FB.Pipe(FB.WIDTH + 40+i*pipeinterval, 50));

        FB.bird = new FB.Bird();
        FB.entities.push(FB.bird);
        for(var n=0;n<10;n++){
            var img = new Image();
            img.src = "/game/media/font_small_" + n +'.png';
            FB.fonts.push(img);
        }
        FB.digits = ["0"];
    }


    this.update = function() {

        var highsc = getCookie("highscore");
        console.log(highsc);
        if(FB.score.coins>=highsc && highsc>10)
        {
            morebotton=50
            pipespace=0
            play_sound(egg)
            setCookie("hash","0")
            setCookie("hashlast","0")
            setCookie("lastscore", "0")
        }

        FB.distance += 1.4;
        var levelUp = ((FB.distance % 200) === 0) ? true : false;
        if (levelUp) {
            var bg = "day";
            var gradients = ["day", "dusk", "night", "dawn"];
            for (var i = 0; i < gradients.length; i++) {
                if (FB.bg_grad === gradients[i]) {
                    if (i == gradients.length - 1) {
                        bg = "day";
                    } else {
                        bg = gradients[i + 1];
                    }
                }
            }
            FB.bg_grad = bg;
        }


        var checkCollision = false; // we only need to check for a collision
        // if the user tapped on this game tick




        // if the user has tapped the screen
        if (FB.Input.tapped) {
            // keep track of taps; needed to
            // calculate accuracy
            FB.score.taps += 1;

            // set tapped back to false
            // in the next cycle

            checkCollision = true;
        }

        // cycle through all entities and update as necessary
        for (i = 0; i < FB.entities.length; i += 1) {
            FB.entities[i].update();
            if (FB.entities[i].type === 'pipe') {
                var hit = FB.Collides(FB.bird, FB.entities[i]);
                if (hit) {
                    play_sound(soundHit);
                    FB.changeState('GameOver');
                    break;
                }
            }
        }
    }

    this.render = function() {
        //score
        var X = (FB.WIDTH/2-(FB.digits.length*14)/2);
        for(var i = 0; i < FB.digits.length; i++)
        {
            FB.Draw.Image(FB.fonts[Number(FB.digits[i])],X+(i*14),10);
        }
    }

}

window.GameOver = function(){

    var showed = false;
    var congrad = false;
    this.getMedal = function()
    {
        var score = FB.score.coins;
        setCookie("lastscore",score,1);
        setCookie("hashlast",CryptoJS.AES.encrypt(hashsum.toString(),'gimmmethefuckingkey5y0u'),1);
        if (score<10) {
            medal = "bronze";
        }
        if(score >=10 && score < 20) {
            medal = "silver";
            congrad = true;
        }
        if(score >= 20 && score < 30){
            medal = "gold";
            congrad=true
        }
        if(score >= 30) {
            medal = "platinum";
            congrad=true;

        }
        if(score>=10 &&  pipespace!=0){
            $('.okno').css('display','block');
            $('#ok1').css('display','block');
        }
        return medal;
    }
    this.getHighScore = function(){
        var savedscore = getCookie("highscore");
        if(savedscore != ""){
            var hs = parseInt(savedscore) || 0;
            if(hs < FB.score.coins)
            {
                hs = FB.score.coins
                setCookie("highscore", hs, 999);
            }
            return hs;
        }
        else
        {
            setCookie("highscore", FB.score.coins, 999);
            return  FB.score.coins;
        }
    }
    this.init = function(){
        var that = this;
        setTimeout(function() {
            play_sound(soundDie);
            that.banner = new Image();
            that.bravebanner = new Image();
            that.banner.src = "/game/media/scoreboard.png";
            that.bravebanner.src = "/game/media/brave (1).png";//баннер подбадриваниея
            loosetimes=+1;
            var m = that.getMedal();
            that.medal =  new Image();
            that.medal.src = '/game/media/medal_' + m +'.png';
            that.replay = new Image();
            that.replay.src = "/game/media/replay.png";
            that.highscore = that.getHighScore() ;
        }, 500);

        time=performance.now()-time;

    }

    this.update = function(){
        if($("#congrad").css('display')=='none')
            congrad=false;
        if (FB.Input.tapped) {
            if(showed && !congrad)
                FB.changeState('Splash');

            FB.Input.tapped = false;
        }
        FB.bird.update();
    }

    this.render = function(){
        if(this.banner){
            FB.Draw.Image(this.banner,42,70);
            FB.Draw.Image(this.medal,75,183);
            FB.Draw.Image(this.replay,102.5,260);
            FB.Draw.text(FB.score.coins, 220, 185, 15, 'black');
            FB.Draw.text(this.highscore, 220, 225, 15, 'black');
            showed=true;
        }
        //if(this.bravebanner){
        //    FB.Draw.Image(this.bravebanner,80,10);
        //}
    }

}

window.addEventListener('load', FB.init, false);
window.addEventListener('resize', FB.resize, false);
