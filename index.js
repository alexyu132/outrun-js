// Game constants
const FOV = 100,    // Field of view in degrees
    PI = 3.14159,
    // Color constants
    ROAD_COLOR = "#999999",
    MARKING_COLOR = "#ffd8FF",
    SKY_COLOR = "#1e90ff",
    // Dimension/layout constants
    CAM_HEIGHT = 90,
    ROAD_WIDTH = 800,
    ROAD_SECTION_LENGTH = 400,
    MARKING_LENGTH = 130,
    RENDER_DIST = 7500,
    MAP_INTERVAL = 4000,    // Distance between each turn value
    MAP = [-10, -10, 20, 10, -5, 0, 0, 0, 50, 40, 30, 20, -50, -50, 0, 0, 0],
    HILL_MAP = [0, 300, 300, 300, 1000, -300, 0, 0];

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
    camY = CAM_HEIGHT;
    camZ = 100;

    keys = new Keys();

    onResize();
}

/**************************************************
** GAME UPDATE LOOP
**************************************************/
// Game variables
var zRate = 0, xRate = 0;
function gameLoop() {

    camZ = camZ + zRate;

    if (keys.up) zRate += 0.6;
    if (keys.down) zRate -= 0.65;
    if (keys.left) xRate -= 0.45;
    if (keys.right) xRate += 0.45;

    if (xRate > 0 && (keys.left && keys.right || !keys.right)) {
        xRate -= 0.5;
    }
    else if (xRate < 0 && (keys.left && keys.right || !keys.left)) {
        xRate += 0.5;
    }

    zRate = clamp(zRate - 0.25, 0, 90);

    xRate = clamp(clamp(xRate, -zRate * 0.4, zRate * 0.4), -12, 12);

    camX += xRate - getTurnAtPos(camZ) * 0.0045 * zRate;

    camX = clamp(camX, -ROAD_WIDTH, ROAD_WIDTH);
    camY = CAM_HEIGHT + getHeightAtPos(camZ);

    if (camX < -ROAD_WIDTH / 2 || camX > ROAD_WIDTH / 2) {
        zRate -= 0.0003 * Math.pow(zRate, 2);
    }

    draw();
    requestAnimationFrame(gameLoop);
}

/**************************************************
** GAME RENDER
**************************************************/
function draw() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw road
    gameContext.fillStyle = ROAD_COLOR;
    // Pseudo curve variables
    var topY = gameCanvas.height;
    var turnSpeed = -(camZ % ROAD_SECTION_LENGTH) / ROAD_SECTION_LENGTH * getTurnAtPos(camZ - camZ % ROAD_SECTION_LENGTH), turnOffset = 0;
    for (z = camZ - (camZ % ROAD_SECTION_LENGTH); z < camZ + RENDER_DIST - camZ % ROAD_SECTION_LENGTH; z += ROAD_SECTION_LENGTH) {
        turnSpeed += getTurnAtPos(z);
        topY = drawRoadSection(0, z, topY, ROAD_WIDTH, ROAD_SECTION_LENGTH, turnOffset, turnOffset + turnSpeed);
        turnOffset += turnSpeed;
    }

    // Draw lane markers
    gameContext.fillStyle = MARKING_COLOR;
    topY = gameCanvas.height;
    turnSpeed = -(camZ % ROAD_SECTION_LENGTH) / ROAD_SECTION_LENGTH * getTurnAtPos(camZ - camZ % ROAD_SECTION_LENGTH);
    turnOffset = 0;
    for (z = camZ - (camZ % ROAD_SECTION_LENGTH); z < camZ + RENDER_DIST - camZ % ROAD_SECTION_LENGTH; z += ROAD_SECTION_LENGTH) {
        turnSpeed += getTurnAtPos(z);
        drawRoadSection(-ROAD_WIDTH / 4, z, topY, 15, MARKING_LENGTH, turnOffset, turnOffset + turnSpeed * MARKING_LENGTH / ROAD_SECTION_LENGTH);
        drawRoadSection(0, z, topY, 15, MARKING_LENGTH, turnOffset, turnOffset + turnSpeed * MARKING_LENGTH / ROAD_SECTION_LENGTH);
        topY = drawRoadSection(ROAD_WIDTH / 4, z, topY, 15, MARKING_LENGTH, turnOffset, turnOffset + turnSpeed * MARKING_LENGTH / ROAD_SECTION_LENGTH);
        turnOffset += turnSpeed;
    }

    // Draw sky
    gameContext.fillStyle = SKY_COLOR;
    gameContext.fillRect(0, 0, gameCanvas.width, topY + 1);
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
    // Maximize the canvas, keeping 16:9 ratio
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    focal = gameCanvas.width / 2 / Math.tan(FOV * Math.PI / 360);
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
function projectX(x, z) {
    return (x - camX) * focal / (z - camZ) + gameCanvas.width / 2;
}

// Get projected x coordinate, including turn distortion
function projectXWithTurn(x, z, turn) {
    return (x - camX + turn * Math.pow(z - camZ, 2)) * focal / (z - camZ) + gameCanvas.width / 2;
}

// Get projected y coordinate
function projectY(y, z) {
    return gameCanvas.height / 2 - ((y - camY) * focal / (z - camZ));// - 0.000001*(z-camZ)*(z-camZ));
}

// Get turn value at z position
function getTurnAtPos(z) {
    var ind = Math.floor(z / MAP_INTERVAL) % MAP.length,
        ind2 = ind + 1 > MAP.length - 1 ? 0 : ind + 1;
    return (MAP[ind2] * (z % MAP_INTERVAL) + MAP[ind] * (MAP_INTERVAL - (z % MAP_INTERVAL))) / MAP_INTERVAL;
}

// Get height at z position
function getHeightAtPos(z) {
    var ind = Math.floor(z / MAP_INTERVAL) % HILL_MAP.length,
        ind2 = ind + 1 > HILL_MAP.length - 1 ? 0 : ind + 1,
        percent = (1 - Math.cos(PI * (z % MAP_INTERVAL) / MAP_INTERVAL)) / 2; // Cosine interpolation
    return HILL_MAP[ind2] * percent + HILL_MAP[ind] * (1 - percent);
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

// Draws section of road and returns highest y value drawn to
function drawRoadSection(x, z, topY, width, length, startTurn, endTurn) {

    if (z + length - camZ <= 0) {
        return;
    }

    x1 = x - width / 2;
    x2 = x + width / 2;

    var zNew = z - camZ <= 0 ? camZ + 1 : z;

    outY1 = projectY(getHeightAtPos(zNew), zNew);
    outY2 = projectY(getHeightAtPos(z + length), z + length);
    if (outY2 >= outY1 || outY2 > topY) return topY;

    outX1 = projectX(x1 + startTurn, zNew);
    outX2 = projectX(x2 + startTurn, zNew);
    outX3 = projectX(x1 + endTurn, z + length);
    outX4 = projectX(x2 + endTurn, z + length);

    // Reduce drawing outside window
    if (outX1 < 0 && outX3 < 0) {
        outX1 = 0;
        outX3 = 0;
    }
    if (outX2 > gameCanvas.width && outX4 > gameCanvas.width) {
        outX2 = gameCanvas.width;
        outX4 = gameCanvas.width;
    }

    gameContext.beginPath();
    gameContext.moveTo(Math.round(outX1), Math.round(outY1));
    gameContext.lineTo(Math.round(outX2), Math.round(outY1));
    gameContext.lineTo(Math.round(outX4), Math.round(outY2));
    gameContext.lineTo(Math.round(outX3), Math.round(outY2));
    gameContext.closePath();
    gameContext.fill();

    // Return top Y of section end
    return projectY(getHeightAtPos(z + ROAD_SECTION_LENGTH), z + ROAD_SECTION_LENGTH);
}

/**************************************************
** GAME START
**************************************************/
init();
setEventHandlers();
gameLoop();