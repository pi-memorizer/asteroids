/**@function
 * Constructor for Asteroids in the game
 * @param {number} x - The x coordinate to spawn the asteroid at
 * @param {number} y - The y coordinate to spawn the asteroid at
 * @param {number} radius - The max radius in pixels for the new asteroid
 * @return {Asteroid} - The new Asteroid object
 */
function Asteroid(x, y, radius)
{
    this.x = x;
    this.y = y;
    this.radius = 7*radius/10+3*radius/10*Math.random();
    this.vx = (Math.random() * 2 - 1)*ASTEROID_SPEED;
    this.vy = (Math.random() * 2 - 1)*ASTEROID_SPEED;
}

/**@function
 * Constructor for both enemy and player bullets
 * @param {number} x - The x coordinate to spawn the bullet at
 * @param {number} y - The y coordinate to spawn the bullet at
 * @param {number} angle - The angle (in radians) that points in
 * the direction that the bullet will move
 * @return {Bullet} - The new Bullet object
 */
function Bullet(x,y,angle)
{
    this.x = x;
    this.y = y;
    this.vx = BULLET_SPEED*Math.cos(angle);
    this.vy = -BULLET_SPEED*Math.sin(angle);
    this._x = this.x;
    this._y = this.y;
    this.alive = true;
}

/**@function
 * Takes a number and wraps it around the world if necessary to fit in the 256x256 playspace
 * @param {number} x - The number (one of the coordinate parts) to wrap
 * @return {number} - The wrapped version of the coordinate part
*/
function wrap(x)
{
    return (x + 256) % 256;
}

/**@function
 * Checks to see if two circles collide in wrapping two dimensional space
 * @param {number} x1 - The center x coordinate of the first circle
 * @param {number} y1 - The center y coordinate of the first circle
 * @param {number} r1 - The radius of the first circle
 * @param {number} x2 - The center x coordinate of the second circle
 * @param {number} y2 - The center y coordinate of the second circle
 * @param {number} r2 - The radius of the second circle
 * @return {number} - Whether or not the circles are colliding
 */
function sphereCollides(x1,y1,r1,x2,y2,r2)
{
    var x = Math.abs(x2 - x1);
    if (x > 128) x = 255 - x;
    var y = Math.abs(y2 - y1);
    if (y > 128) y = 255 - y;
    return x * x + y * y <= (r1 + r2) * (r1 + r2);
}

/**@function
 * Fills the screen with non-intersecting asteroids, scaling up the quantity by 2 each level.
 */
function fillAsteroids()
{
    for (var i = 0; i < 10+level*2; i++) {
        var x = 0;
        var y = 0;
        var flag = true;
        while (flag) {
            flag = false;
            x = Math.random() * 256;
            y = Math.random() * 256;
            for (var j = 0; j < i; j++) {
                if (sphereCollides(x, y, 20, asteroids[j].x, asteroids[j].y, asteroids[j].radius)) {
                    flag = true;
                    break;
                }
            }
            if (!flag && sphereCollides(player.x, player.y, 30, x, y, 20)) {
                flag = true;
            }
        }
        asteroids.push(new Asteroid(x, y, 20));
    }
}

/**@function
 * Instantiates the entire game
 */
function init()
{
    canvas = document.getElementById("canvas");
    realContext = canvas.getContext("2d");
    bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;
    bufferContext = bufferCanvas.getContext("2d");
    context = bufferContext;

    deltaTime = -1;
    invincibility = 0;
    input = [];
    input._fire = false;
    input._down = false;
    fireTimer = 0;
    FIRE_TIME = .1;
    score = 0;
    lives = 3;
    level = 0;
    playing = true;

    player = [];
    player.x = 128;
    player.y = 128;
    player.vx = 0;
    player.vy = 0;
    PLAYER_LENGTH = 10;
    player.dir = 0;
    PLAYER_SPEED = 150;
    PLAYER_ANGLE = Math.PI / 4;

    BULLET_SPEED = 50;
    bullets = [];

    asteroids = [];
    ASTEROID_SPEED = 23;
    fillAsteroids();
}

/** @function
 * Checks whether or not a point is outside of the playing field
 * @param {number} x - The x coordinate to check
 * @param {number} y - The y coordinate to check
 * @return {boolean} - Whether or not the point was on the playing field
 */
function outside(x,y)
{
    return (x<0||x>=canvas.width)||(y<0||y>canvas.height);
}

/**@function
 * Linearly interpolates between two values
 * @param {number} x - The first value
 * @param {number} y - The second value
 * @param {number} a - The interpolation factor, between 0 and 1 inclusive
 * @return {number} The linearly interpolated value
 */
function lerp(x,y,a)
{
    return a * x + (1 - a) * y;
}

/**@function
 * Clamps a number between 0 and 255 inclusive to keep it on screen
 * @param {number} x - The number to clamp
 * @return {number} - The clamped number
 */
function clamp(x)
{
    if (x < 0) return 0;
    if (x > 255) return 255;
    return x;
}

/** @function
 * Updates all game logic such as player controlling, collision, motion, and game state.
 * At finishing, it sets up a call to call itself again on the next frame.
 * @param {number} elapsedTime - The time in seconds since the start of the program
 */
function update(elapsedTime)
{
    if(deltaTime==-1) deltaTime = 0;
    else {
        deltaTime = (elapsedTime - _elapsedTime)/1000;
    }
    _elapsedTime = elapsedTime;

    if(isNaN(deltaTime)) deltaTime = 0;

    if(!playing)
    {
        if(input.fire&&!input._fire)
        {
            init();
        }
        render();
        window.requestAnimationFrame(update);
        input._fire = input.fire;
        return;
    }

    if (invincibility > 0)
    {
        invincibility -= deltaTime;
    }

    var px1 = player.x - PLAYER_LENGTH * Math.cos(player.dir + PLAYER_ANGLE / 2);
    var py1 = player.y + PLAYER_LENGTH * Math.sin(player.dir + PLAYER_ANGLE / 2);
    var px2 = player.x - PLAYER_LENGTH * Math.cos(player.dir - PLAYER_ANGLE / 2);
    var py2 = player.y + PLAYER_LENGTH * Math.sin(player.dir - PLAYER_ANGLE / 2);

    for (var i = 0; i < asteroids.length; i++)
    {
        var a = asteroids[i];

        //calculate new position
        var x = a.vx * deltaTime;
        var y = a.vy * deltaTime;
        a.x = wrap(a.x+x);
        a.y = wrap(a.y + y);

        //test collisions
        var c = false;
        for (var j = 0; j < asteroids.length; j++)
        {
            if(i!=j)
            {
                if(sphereCollides(asteroids[i].x,asteroids[i].y,asteroids[i].radius,asteroids[j].x,asteroids[j].y,asteroids[j].radius))
                {
                    bump.play();
                    //do elastic collision
                    var m1 = asteroids[i].radius * asteroids[i].radius;
                    var m2 = asteroids[j].radius * asteroids[j].radius;
                    var v1x = asteroids[i].vx;
                    var v1y = asteroids[i].vy;
                    var v2x = asteroids[j].vx;
                    var v2y = asteroids[j].vy;
                    asteroids[i].vx = (m1 - m2) / (m1 + m2) * v1x + (2 * m2) / (m1 + m2) * v2x;
                    asteroids[i].vy = (m1 - m2) / (m1 + m2) * v1y + (2 * m2) / (m1 + m2) * v2y;

                    asteroids[j].vx = 2 * m1 / (m1 + m2) * v1x + (m2 - m1) / (m1 + m2) * v2x;
                    asteroids[j].vy = 2 * m1 / (m1 + m2) * v1y + (m2 - m1) / (m1 + m2) * v2y;
                    c = true;
                    break;
                }
            }
        }

        //if collision, revert position
        if(c)
        {
            a.x = wrap(a.x - x);
            a.y = wrap(a.y - y);
        }

        if(invincibility<=0&&(sphereCollides(asteroids[i].x,asteroids[i].y,asteroids[i].radius,player.x,player.y,0)||
            sphereCollides(asteroids[i].x,asteroids[i].y,asteroids[i].radius,px1,py1,0)||
            sphereCollides(asteroids[i].x,asteroids[i].y,asteroids[i].radius,px2,py2,0)))
        {
            explosion2.play();
            lives--;
            if (lives == 0) {
                playing = false;
            } else invincibility = 3;
        }
    }
    for (var i = 0; i < bullets.length; i++)
    {
        var remove = false;
        for(var j = 0; j < asteroids.length; j++)
        {
            var c = false;
            for (var k = 0; k < 20; k++)
            {
                if(sphereCollides(clamp(lerp(bullets[i].x,bullets[i]._x,k/20)),clamp(lerp(bullets[i].y,bullets[i]._y,k/20)),1,asteroids[j].x,asteroids[j].y,asteroids[j].radius)) 
                {
                    score += 10;
                    c = true;
                    break;
                }
            }
            if(c)
            {
                explosion.play();
                //split asteroids
                if (asteroids[j].radius > 5) {
                    var p = [];
                    var angle = Math.atan2(bullets[i].y - bullets[i]._y, bullets[i].x - bullets[i]._x);
                    p.x = Math.cos(angle + Math.PI / 2) * asteroids[j].radius;
                    p.y = Math.sin(angle + Math.PI / 2) * asteroids[j].radius;
                    var a1 = new Asteroid(p.x / 2 + asteroids[j].x, p.y / 2 + asteroids[j].y, asteroids[j].radius / 2);
                    a1.vx = asteroids[j].vy / 2;
                    a1.vy = -asteroids[j].vx / 2;
                    var a2 = new Asteroid(-p.x / 2 + asteroids[j].x, -p.y / 2 + asteroids[j].y, asteroids[j].radius / 2);
                    a2.vx = -asteroids[j].vy / 2;
                    a2.vy = asteroids[j].vx / 2;
                    asteroids[j] = a1;
                    asteroids.push(a2);
                } else {
                    asteroids[j] = asteroids[asteroids.length - 1];
                    asteroids.pop();
                    if(asteroids.length==0)
                    {
                        level++;
                        fillAsteroids();
                    }
                }
                //remove bullet
                remove = true;
                break;
            }
        }
        bullets[i]._x = bullets[i].x;
        bullets[i]._y = bullets[i].y;
        bullets[i].x += bullets[i].vx * BULLET_SPEED * deltaTime;
        bullets[i].y += bullets[i].vy * BULLET_SPEED * deltaTime;
        if (bullets[i].remove) remove = true;
        if(bullets[i].x<0||bullets[i].x>255||bullets[i].y<0||bullets[i].y>255)
        {
            bullets[i].remove = true;
        }
      
        if(remove)
        {
            bullets[i] = bullets[bullets.length - 1];
            bullets.pop();
        }
    }

    if(input.left) player.dir += Math.PI*deltaTime;
    if(input.right) player.dir -= Math.PI*deltaTime;
    if (input.up)
    {
        player.vx += PLAYER_SPEED * Math.cos(player.dir)*deltaTime;
        player.vy -= PLAYER_SPEED * Math.sin(player.dir)*deltaTime;
    }
    if (input.fire && !input._fire)
    {
        laser.play();
        bullets.push(new Bullet(player.x, player.y, player.dir));
    }
    if (input.down && !input._down)
    {
        player.x = Math.random() * 256;
        player.y = Math.random() * 256;
    }

    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;
    player.x = (player.x+256) % 256;
    player.y = (player.y+256) % 256;

    input._fire = input.fire;
    input._down = input.down;
    render();
    window.requestAnimationFrame(update);
}

/**@function
 * Renders an object according to graphical wrapping concepts
 * @param {number} x - The x coordinate of the object's center
 * @param {number} y - The y coordinate of the object's center
 * @param {number} r - The radius of the object to render
 * @param {number} fun - The function that takes in an x and y coordinate
 *             to render its object, will be called 1 to 4 times
 */
function renderObject(x,y,r,fun)
{
    fun(x,y);
    if (x - r < 0) fun(x + 256, y);
    if (x + r > 255) fun(x - 256, y);
    if (y - r < 0) fun(x, y + 256);
    if (y + r > 255) fun(x, y - 256);
    if (x - r < 0 && y - r < 0) fun(x + 256, y + 256);
    if (x - r < 0 && y + r > 255) fun(x + 256, y - 256);
    if (x + r > 255 && y - r < 0) fun(x - 256, y + 256);
    if (x + r > 255 && y + r > 255) fun(x - 256, y - 256);
}

/**@function
 * Renders the player at a given non-wrapped coordinate
 * @param {number} x - The x coordinate to render at
 * @param {number} y - The y coordinate to render at
 */
function renderPlayer(x,y)
{
    context.strokeStyle = "white";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - PLAYER_LENGTH * Math.cos(player.dir + PLAYER_ANGLE / 2), y + PLAYER_LENGTH * Math.sin(player.dir + PLAYER_ANGLE / 2));
    context.moveTo(x, y);
    context.lineTo(x - PLAYER_LENGTH * Math.cos(player.dir - PLAYER_ANGLE / 2), y + PLAYER_LENGTH * Math.sin(player.dir - PLAYER_ANGLE / 2));
    context.stroke();
}

/**@function
 * Renders an asteroid at a given non-wrapped coordinate 
 * @param {number} x - The x coordinate to render at
 * @param {number} y - The y coordinate to render at
 */
Asteroid.prototype.render = function(x,y)
{
    context.strokeStyle = "white";
    context.beginPath();
    context.arc(x, y, this.radius, 0, 2 * Math.PI);
    context.stroke();
}

/** @function
 * Renders the game to a double buffer, then to the normal buffer
 */
function render()
{
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    //context.translate(-20, -20);
    
    if(playing)if(invincibility<=0||((invincibility*8)%2>.5)) renderObject(player.x, player.y, PLAYER_LENGTH, renderPlayer);

    for (var i = 0; i < asteroids.length; i++)
    {
        var asteroid = asteroids[i];
        renderObject(asteroid.x, asteroid.y, asteroid.radius, function (x,y) { asteroid.render(x,y) });
    }
   
    for (var i = 0; i < bullets.length; i++)
    {
        var b = bullets[i];
        context.strokeStyle = "white";
        context.beginPath();
        context.moveTo(b.x, b.y);
        context.lineTo(b._x, b._y);
        context.stroke();
    }

    //context.closePath();
    context.resetTransform();
    context.fillStyle = "black";
    context.fillRect(0, 256, canvas.width, 40);
    context.font = "20px Arial";
    context.fillStyle = "white";
    context.fillText("Score: " + score, 0, 256 + 30);
    context.fillText("Lives: " + lives, 180, 256 + 30);

    if (!playing)
    {
        context.fillStyle = "black";
        context.fillRect(0, 100, 256, 80);
        context.font = "40px Arial";
        context.fillStyle = "white";
        context.fillText("GAME OVER", 5, 150);
        context.font = "10px Arial";
        context.fillText("Press the fire button to play again", 40, 170);
    }
    realContext.drawImage(bufferCanvas,0,0);
}

/** @function
 * Takes a keydown event and sets input flags if necessary
 * @param {Event} event - The keydown event to handle
 */
function keydown(event)
{
    if(event.key=="ArrowLeft") input.left = true;
    if (event.key == "ArrowRight") input.right = true;
    if (event.key == "ArrowUp") input.up = true;
    if (event.key == "ArrowDown") input.down = true;
    if(event.key==" "||event.key=="z") input.fire = true;
}

/** @function
 * Takes a keyup event and set input flags if necessary
 * @param {Event} event - The keyup event to handle
 */
function keyup(event)
{
    if(event.key=="ArrowLeft") input.left = false;
    if (event.key == "ArrowRight") input.right = false;
    if (event.key == "ArrowUp") input.up = false;
    if (event.key == "ArrowDown") input.down = false;
    if (event.key == " " || event.key == "z") input.fire = false;
}

document.addEventListener("keydown",keydown);
document.addEventListener("keyup", keyup);

explosion = new Audio("explosion.wav");
explosion2 = new Audio("explosion2.wav");
bump = new Audio("bump.wav");
laser = new Audio("laser.wav");

init()
update();