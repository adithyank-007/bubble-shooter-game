const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const bubbleRadius = 20;
const bubbleColors = ['red', 'green', 'blue', 'yellow', 'purple'];
const gridRows = 12;
const gridCols = 20;
const bubbleGrid = [];
let isShooting = false;
let score = 0;

// Shooter
let shooterBubble;

// Mouse position
let mouseX = canvas.width / 2;
let mouseY = canvas.height - bubbleRadius;

// Initialize the grid
function initGrid() {
    for (let i = 0; i < gridRows; i++) {
        bubbleGrid[i] = [];
        for (let j = 0; j < gridCols; j++) {
            if (i < 5) { // Only fill the first 5 rows
                const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
                bubbleGrid[i][j] = {
                    x: j * bubbleRadius * 2 + bubbleRadius,
                    y: i * bubbleRadius * 2 + bubbleRadius,
                    color: color,
                    isAlive: true,
                    row: i,
                    col: j
                };
            } else {
                bubbleGrid[i][j] = null;
            }
        }
    }
}

// Create a new bubble for the shooter
function newShooterBubble() {
    const color = bubbleColors[Math.floor(Math.random() * bubbleColors..length)];
    shooterBubble = {
        x: canvas.width / 2,
        y: canvas.height - bubbleRadius,
        color: color,
        isAlive: true,
        dx: 0,
        dy: 0
    };
}

// Draw a single bubble
function drawBubble(bubble) {
    if (bubble && bubble.isAlive) {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = bubble.color;
        ctx.fill();
        ctx.closePath();
    }
}

// Draw the grid of bubbles
function drawGrid() {
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            drawBubble(bubbleGrid[i][j]);
        }
    }
}

// Update the shooter bubble's position
function updateShooter() {
    if (isShooting) {
        shooterBubble.x += shooterBubble.dx;
        shooterBubble.y += shooterBubble.dy;

        // Wall collisions
        if (shooterBubble.x - bubbleRadius < 0 || shooterBubble.x + bubbleRadius > canvas.width) {
            shooterBubble.dx *= -1;
        }

        // Top collision
        if (shooterBubble.y - bubbleRadius < 0) {
            snapBubble(0, Math.floor(shooterBubble.x / (bubbleRadius * 2)));
            return;
        }

        // Collision with grid bubbles
        for (let i = 0; i < gridRows; i++) {
            for (let j = 0; j < gridCols; j++) {
                const bubble = bubbleGrid[i][j];
                if (bubble && bubble.isAlive) {
                    const dx = shooterBubble.x - bubble.x;
                    const dy = shooterBubble.y - bubble.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < bubbleRadius * 2) {
                        snapBubble(i, j);
                        return;
                    }
                }
            }
        }
    }
}

function snapBubble(row, col) {
    isShooting = false;

    // Find the closest empty grid position
    let newRow = row;
    let newCol = col;

    // Simplified snapping logic
    if (!bubbleGrid[newRow] || !bubbleGrid[newRow][newCol] || bubbleGrid[newRow][newCol].isAlive) {
        newRow = Math.round(shooterBubble.y / (bubbleRadius * 2));
        newCol = Math.round(shooterBubble.x / (bubbleRadius * 2));
    }

    if (newRow >= gridRows) newRow = gridRows - 1;
    if (newCol >= gridCols) newCol = gridCols - 1;

    if (bubbleGrid[newRow] && !bubbleGrid[newRow][newCol]) {
        bubbleGrid[newRow][newCol] = {
            x: newCol * bubbleRadius * 2 + bubbleRadius,
            y: newRow * bubbleRadius * 2 + bubbleRadius,
            color: shooterBubble.color,
            isAlive: true,
            row: newRow,
            col: newCol
        };

        const cluster = findCluster(newRow, newCol, shooterBubble.color);
        if (cluster.length >= 3) {
            removeCluster(cluster);
            removeFloatingBubbles();
            score += cluster.length * 10;
        }

    } else {
        // Game Over condition
        gameOver();
        return;
    }

    if (checkWin()) {
        winGame();
    }

    newShooterBubble();
    checkGameOver();
}

function findCluster(startRow, startCol, color) {
    const cluster = [];
    const toVisit = [[startRow, startCol]];
    const visited = new Set();

    while (toVisit.length > 0) {
        const [row, col] = toVisit.pop();
        const key = `${row},${col}`;

        if (row < 0 || row >= gridRows || col < 0 || col >= gridCols || visited.has(key)) {
            continue;
        }

        visited.add(key);
        const bubble = bubbleGrid[row][col];

        if (bubble && bubble.isAlive && bubble.color === color) {
            cluster.push(bubble);

            // Check neighbors
            toVisit.push([row - 1, col]);
            toVisit.push([row + 1, col]);
            toVisit.push([row, col - 1]);
            toVisit.push([row, col + 1]);
        }
    }

    return cluster;
}

function removeCluster(cluster) {
    for (const bubble of cluster) {
        bubble.isAlive = false;
    }
}

function removeFloatingBubbles() {
    const connected = new Set();

    // Find all bubbles connected to the top row
    for (let j = 0; j < gridCols; j++) {
        if (bubbleGrid[0][j] && bubbleGrid[0][j].isAlive) {
            const cluster = findCluster(0, j, bubbleGrid[0][j].color);
            for (const bubble of cluster) {
                connected.add(bubble);
            }
        }
    }

    // Remove bubbles that are not connected
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            const bubble = bubbleGrid[i][j];
            if (bubble && bubble.isAlive && !connected.has(bubble)) {
                bubble.isAlive = false;
            }
        }
    }
}

function checkGameOver() {
    for (let j = 0; j < gridCols; j++) {
        if (bubbleGrid[gridRows - 1][j] && bubbleGrid[gridRows - 1][j].isAlive) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    alert('Game Over! Your score: ' + score);
    initGrid();
    newShooterBubble();
    score = 0;
}

function checkWin() {
    for (let i = 0; i < gridRows; i++) {
        for (let j = 0; j < gridCols; j++) {
            if (bubbleGrid[i][j] && bubbleGrid[i][j].isAlive) {
                return false;
            }
        }
    }
    return true;
}

function winGame() {
    alert('You Win! Your score: ' + score);
    initGrid();
    newShooterBubble();
    score = 0;
}

// Aiming line
function drawAimingLine() {
    if (!isShooting) {
        ctx.beginPath();
        ctx.moveTo(shooterBubble.x, shooterBubble.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.closePath();
    }
}

function drawScore() {
    ctx.font = '24px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Score: ' + score, 10, 30);
}


// Game loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawBubble(shooterBubble);
    drawAimingLine();
    drawScore();

    updateShooter();

    requestAnimationFrame(gameLoop);
}

// Mouse move event
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Mouse click event
canvas.addEventListener('click', () => {
    if (!isShooting) {
        isShooting = true;
        const angle = Math.atan2(mouseY - shooterBubble.y, mouseX - shooterBubble.x);
        const speed = 10;
        shooterBubble.dx = Math.cos(angle) * speed;
        shooterBubble.dy = Math.sin(angle) * speed;
    }
});

// Start the game
initGrid();
ewShooterBubble();
gameLoop();