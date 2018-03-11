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

    gameContext.fillStyle = "#880000";
    gameContext.strokeStyle = "#990000";

    camX = 0;
    camY = 0;
    camZ = 0;

    keys = new Keys();

    onResize();
}

/**************************************************
** GAME UPDATE LOOP
**************************************************/
function gameLoop() {
    camZ += 10;
    if (camZ > -100) {
        camZ -= 1000;
    }
    draw();
    requestAnimationFrame(gameLoop);
}

/**************************************************
** GAME RENDER
**************************************************/
function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    drawLine3D(-50, -50, 0, 50, -50, 0);
    drawLine3D(50, -50, 0, 50, 50, 0);
    drawLine3D(50, 50, 0, -50, 50, 0);
    drawLine3D(-50, 50, 0, -50, -50, 0);
    drawLine3D(-50, -50, -100, 50, -50, -100);
    drawLine3D(50, -50, -100, 50, 50, -100);
    drawLine3D(50, 50, -100, -50, 50, -100);
    drawLine3D(-50, 50, -100, -50, -50, -100);
}

/**************************************************
** GAME EVENT HANDLERS
**************************************************/
function setEventHandlers() {
    // Keyboard and mouse
    window.addEventListener("keydown", onKeydown, false);
    window.addEventListener("keyup", onKeyup, false);

    // Window resize
    window.addEventListener("resize", onResize, false);
};

// Keyboard key down
function onKeydown(e) {
    keys.onKeydown(e);
};

// Keyboard key up
function onKeyup(e) {
    keys.onKeyup(e);
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

// Project point and return as normalized point
function projectPoint(x, y, z) {
    var outX = (x - camX) * focal / (z - camZ),
        outY = -((y - camY) * focal / (z - camZ));

    outX += gameCanvas.width / 2;
    outY += gameCanvas.height / 2;

    return [outX, outY];
}

function drawLine3D(x1, y1, z1, x2, y2, z2) {
    [outX1, outY1] = projectPoint(x1, y1, z1);
    [outX2, outY2] = projectPoint(x2, y2, z2);

    gameContext.beginPath();
    gameContext.moveTo(Math.floor(outX1), Math.floor(outY1));
    gameContext.lineTo(Math.floor(outX2), Math.floor(outY2));
    gameContext.stroke();
}

/**************************************************
** GAME START
**************************************************/
init();
gameLoop();