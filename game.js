const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

// Game constants
const GRAVITY = 0.4;
const JUMP_STRENGTH = -12;
const PLATFORM_COUNT = 8;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 12;

let gameState = 'START';
let score = 0;
let highestAltitude = 0;
let platforms = [];
let particles = [];

// Player Object
const player = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    color: '#ff00ff',
    
    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw main body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, 10, 5);
        ctx.restore();
    },

    update() {
        this.vy += GRAVITY;
        this.y += this.vy;
        this.x += this.vx;

        // Screen wrap
        if (this.x + this.width < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -this.width;

        // Vertical boundaries & Camera scroll
        if (this.y < canvas.height / 2) {
            const diff = canvas.height / 2 - this.y;
            this.y = canvas.height / 2;
            
            // Move platforms down instead of player up
            platforms.forEach(p => p.y += diff);
            // Move particles down
            particles.forEach(p => p.y += diff);
            
            score += Math.round(diff / 10);
            scoreElement.innerText = `${score}m`;
        }

        // Game Over
        if (this.y > canvas.height + 200) {
            endGame();
        }
    }
};

class Platform {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLATFORM_WIDTH;
        this.height = PLATFORM_HEIGHT;
        this.color = '#00f2ff';
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // Platform gradient
        let gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        gradient.addColorStop(0, '#00f2ff');
        gradient.addColorStop(1, '#0099ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

// Initialization and Generation
function initGame() {
    resize();
    score = 0;
    scoreElement.innerText = '0m';
    
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 150;
    player.vy = JUMP_STRENGTH;
    player.vx = 0;

    platforms = [];
    // Starting platform
    platforms.push(new Platform(player.x - 20, player.y + 100));
    
    // Generate initial set
    for (let i = 1; i < PLATFORM_COUNT; i++) {
        generatePlatform(i);
    }
}

function generatePlatform(index) {
    const spacing = canvas.height / PLATFORM_COUNT;
    const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
    const y = canvas.height - (index * spacing);
    platforms.push(new Platform(x, y));
}

function resize() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Core Loop
function update() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background Grid effect
    drawGrid();

    player.update();
    
    // Collision detection (falling only)
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + p.height + player.vy) {
                
                player.vy = JUMP_STRENGTH;
                // Add jump feedback?
            }
        });
    }

    // Reuse platforms that go off screen
    platforms.forEach((p, i) => {
        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        }
        p.draw();
    });

    player.draw();
    requestAnimationFrame(update);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    // Simple static grid that repeats
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Controller Logic
function handleInput(e) {
    if (gameState !== 'PLAYING') return;
    
    let clientX;
    if (e.type.includes('touch')) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = e.clientX;
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const moveX = (clientX - centerX) / (rect.width / 2);
    
    // Sensitivity
    player.vx = moveX * 8;
}

// State Management
function startGame() {
    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    update();
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

// Events
window.addEventListener('resize', resize);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Controls for both Mobile and Desktop
canvas.addEventListener('mousemove', handleInput);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

window.onload = resize;
