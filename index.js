const FOV = 100;    // Field of view in degrees

var gameCanvas,     // Canvas element
    gameContext,    // Canvas context
    camX, camY, camZ,
    focal,
    keys;

function init() {
    gameCanvas = document.getElementById("gameCanvas");
    gameContext = gameCanvas.getContext("2d");

    focal = gameCanvas.width / 2 / Math.tan(FOV * Math.PI / 360);

    gameContext.fillStyle = "#441122";
    gameContext.strokeStyle = "#990000";

    camX = 0;
    camY = 50;
    camZ = 100;

    keys = new Keys();

    onResize();
}

/**************************************************
** GAME UPDATE LOOP
**************************************************/

var zRate = 0, xRate = 0, turnVal = 0.00009;
function gameLoop() {
    camZ = (camZ + zRate) % 400;
    if (keys.up) zRate += 0.6;
    if (keys.down) zRate -= 0.65;
    if (keys.left) xRate -= 0.5;
    if (keys.right) xRate += 0.5;

    if (xRate > 0 && (keys.left && keys.right || !keys.right)) xRate -= 0.5;
    else if (xRate < 0 && (keys.left && keys.right || !keys.left)) xRate += 0.5;

    zRate -= 0.25;

    zRate = clamp(zRate, 0, 90);

    xRate = clamp(clamp(xRate, -zRate * 0.3, zRate * 0.3), -10, 10);

    camX += xRate - turnVal*1500 * zRate;

    camX = Math.max(-500, Math.min(500, camX));

    draw();
    requestAnimationFrame(gameLoop);
}

/**************************************************
** GAME RENDER
**************************************************/
function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameContext.fillRect(0, 0, gameCanvas.width, projectY(-50, camZ + 8000))

    for (z = 0; z < 7800; z += 400) {
        drawLine3D(-10, -50, z, 10, -50, z);
        drawLine3D(-10, -50, z + 150, 10, -50, z + 150);
        drawLine3D(-10, -50, z, -10, -50, z + 150);
        drawLine3D(10, -50, z, 10, -50, z + 150);
        drawLine3D(-200, -50, z, -200, -50, z + 400);
        drawLine3D(200, -50, z, 200, -50, z + 400);
    }
}

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
function setEventHandlers() {
    // Keyboard and mouse
    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("keyup", onKeyUp, false);

    // Window resize
    window.addEventListener("resize", onResize, false);
};

// Keyboard key down
function onKeyDown(e) {
    keys.onKeyDown(e);
};

// Keyboard key up
function onKeyUp(e) {
    keys.onKeyUp(e);
};

// Browser window resize
function onResize(e) {
    // Maximize the canvas
    if (window.innerWidth / window.innerHeight < 16 / 9) {
        gameCanvas.style.width = window.innerWidth + 'px';
        gameCanvas.style.height = window.innerWidth * 9 / 16 + 'px';
    } else {
        gameCanvas.style.width = window.innerHeight * 16 / 9 + 'px';
        gameCanvas.style.height = window.innerHeight + 'px';
    }
};

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/

// Makes sure a value lies inside min/max
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

// Project point and return as normalized point
function projectPoint(x, y, z) {
    var outX = (x - camX + turnVal * (z - camZ)) * focal / (z - camZ),
        outY = -((y - camY) * focal / (z - camZ));

    outX += gameCanvas.width / 2;
    outY += gameCanvas.height / 2;

    return [outX, outY];
}

// Only get projected x coordinate
function projectX(x, z) {
    return (x - camX + turnVal * (z - camZ) * (z - camZ)) * focal / (z - camZ) + gameCanvas.width / 2;
}

// Only get projected y coordinate
function projectY(y, z) {
    return gameCanvas.height / 2 - ((y - camY) * focal / (z - camZ));// - 0.000001*(z-camZ)*(z-camZ));
}

function drawLine3D(x1, y1, z1, x2, y2, z2) {
    if (z1 - camZ <= 0 && z2 - camZ <= 0) {
        return;
    }

    if (z1 - camZ <= 0) {
        x1 += (camZ - z1) / (z2 - z1) * (x2 - x1);
        y1 += (camZ - z1) / (z2 - z1) * (y2 - y1);
        z1 = camZ + 1;
    } else if (z2 - camZ <= 0) {
        x2 += (camZ - z2) / (z1 - z2) * (x1 - x2);
        y2 += (camZ - z2) / (z1 - z2) * (y1 - y2);
        z2 = camZ + 1;
    }

    outX1 = projectX(x1, z1);
    outY1 = projectY(y1, z1);
    outX2 = projectX(x2, z2);
    outY2 = projectY(y2, z2);

    gameContext.beginPath();
    gameContext.moveTo(Math.round(outX1), Math.round(outY1));
    gameContext.lineTo(Math.round(outX2), Math.round(outY2));
    gameContext.stroke();

}

/**************************************************
** GAME START
**************************************************/
init();
setEventHandlers();
gameLoop();