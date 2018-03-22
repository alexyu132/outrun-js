const FOV = 100,    // Field of view in degrees
    // Color constants
    ROAD_COLOR = "#999999",
    MARKING_COLOR = "#ffd8FF",
    GROUND_COLOR = "#dcd698";

// Render/core variables
var gameCanvas,       // Canvas element
    gameContext,      // Canvas context
    camX, camY, camZ, // Camera position
    focal,            // Focal length
    keys;             // Input handler

function init() {
    gameCanvas = document.getElementById("gameCanvas");
    gameContext = gameCanvas.getContext("2d");

    // Calculate focal length from FOV
    focal = gameCanvas.width / 2 / Math.tan(FOV * Math.PI / 360);

    // Init camera position
    camX = 0;
    camY = 50;
    camZ = 100;

    keys = new Keys();

    onResize();
}

/**************************************************
** GAME UPDATE LOOP
**************************************************/
// Game variables
var zRate = 0, xRate = 0, turnVal = 0.00009;
function gameLoop() {

    camZ = (camZ + zRate);

    if (keys.up) zRate += 0.6;
    if (keys.down) zRate -= 0.65;
    if (keys.left) xRate -= 0.4;
    if (keys.right) xRate += 0.4;

    if (xRate > 0 && (keys.left && keys.right || !keys.right)) xRate -= 0.5;
    else if (xRate < 0 && (keys.left && keys.right || !keys.left)) xRate += 0.5;

    zRate -= 0.25;

    zRate = clamp(zRate, 0, 90);

    xRate = clamp(clamp(xRate, -zRate * 0.3, zRate * 0.3), -10, 10);

    camX += xRate - turnVal * 1500 * zRate;

    camX = clamp(camX, -900, 900);

    draw();
    requestAnimationFrame(gameLoop);
}

/**************************************************
** GAME RENDER
**************************************************/
function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameContext.fillStyle = GROUND_COLOR;

    gameContext.fillRect(0, projectY(-50, camZ + 8000), gameCanvas.width, gameCanvas.height);

    // Draw road
    gameContext.fillStyle = ROAD_COLOR;
    for (z = camZ - (camZ % 400); z < camZ + 7800 - camZ % 400; z += 400) {
        drawRoadPiece(0, -50, z, 800, 400);
    }

    // Draw lane markers
    gameContext.fillStyle = MARKING_COLOR;
    for (z = camZ - (camZ % 400); z < camZ + 7800 - camZ % 400; z += 400) {
        drawRoadPiece(-200, -50, z, 15, 120);
        drawRoadPiece(0, -50, z, 15, 120);
        drawRoadPiece(200, -50, z, 15, 120);
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
    var outX = (x - camX) * focal / (z - camZ),
        outY = -((y - camY) * focal / (z - camZ));

    outX += gameCanvas.width / 2;
    outY += gameCanvas.height / 2;

    return [outX, outY];
}

// Get projected x coordinate
function projectXWithTurn(x, z) {
    return (x - camX) * focal / (z - camZ) + gameCanvas.width / 2;
}

// Get projected x coordinate, including turn distortion
function projectXWithTurn(x, z) {
    return (x - camX + turnVal * Math.pow(z - camZ, 2)) * focal / (z - camZ) + gameCanvas.width / 2;
}

// Get projected y coordinate
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

    outX1 = projectXWithTurn(x1, z1);
    outY1 = projectY(y1, z1);
    outX2 = projectXWithTurn(x2, z2);
    outY2 = projectY(y2, z2);

    gameContext.beginPath();
    gameContext.moveTo(Math.round(outX1), Math.round(outY1));
    gameContext.lineTo(Math.round(outX2), Math.round(outY2));
    gameContext.stroke();

}

function drawRoadPiece(x, y, z, width, length) {

    if (z + length - camZ <= 0) {
        return;
    }

    x1 = x - width / 2;
    x2 = x + width / 2;

    var zNew = z - camZ <= 0 ? camZ + 1 : z;

    outX1 = projectXWithTurn(x1, zNew);
    outX2 = projectXWithTurn(x2, zNew);
    outX3 = projectXWithTurn(x1, z + length);
    outX4 = projectXWithTurn(x2, z + length);
    outY1 = projectY(y, zNew);
    outY2 = projectY(y, z + length);

    gameContext.beginPath();
    gameContext.moveTo(Math.round(outX1), Math.round(outY1));
    gameContext.lineTo(Math.round(outX2), Math.round(outY1));
    gameContext.lineTo(Math.round(outX4), Math.round(outY2));
    gameContext.lineTo(Math.round(outX3), Math.round(outY2));
    gameContext.closePath();
    gameContext.fill();

}

/**************************************************
** GAME START
**************************************************/
init();
setEventHandlers();
gameLoop();