// canvas.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let showContours = true;
let showGradients = false;

// Coordinate transformation
const xMin = -1, xMax = 4;
const yMin = -1, yMax = 4;

function toScreen(x, y) {
    const sx = ((x - xMin) / (xMax - xMin)) * width;
    const sy = height - ((y - yMin) / (yMax - yMin)) * height;
    return [sx, sy];
}

function toWorld(sx, sy) {
    const x = xMin + (sx / width) * (xMax - xMin);
    const y = yMax - (sy / height) * (yMax - yMin);
    return [x, y];
}

// Objective function
function f(x, y) {
    return x * x + 2 * y * y;
}

// Gradient of objective function
function gradF(x, y) {
    return [2 * x, 4 * y];
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const [sx1, sy1] = toScreen(i, yMin);
        const [sx2, sy2] = toScreen(i, yMax);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        const [sx3, sy3] = toScreen(xMin, i);
        const [sx4, sy4] = toScreen(xMax, i);
        ctx.beginPath();
        ctx.moveTo(sx3, sy3);
        ctx.lineTo(sx4, sy4);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    const [ox, oy] = toScreen(0, 0);
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    for (let i = 0; i <= 4; i++) {
        const [sx, sy] = toScreen(i, 0);
        ctx.fillText(i.toString(), sx - 5, sy + 20);
        const [sx2, sy2] = toScreen(0, i);
        ctx.fillText(i.toString(), sx2 - 25, sy2 + 5);
    }

    // Draw contours of objective function
    if (showContours) {
        const levels = [0.5, 1, 2, 3, 4, 6, 8, 10, 15, 20];
        levels.forEach(level => {
            ctx.strokeStyle = `rgba(33, 150, 243, ${0.3 + Math.min(0.5, level / 20)})`;
            ctx.lineWidth = 1.5;
            drawContour(level);
        });
    }

    // Draw feasible region (x <= y)
    ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
    ctx.beginPath();
    const [sx1, sy1] = toScreen(xMin, xMin);
    ctx.moveTo(sx1, sy1);
    const [sx2, sy2] = toScreen(xMin, yMax);
    ctx.lineTo(sx2, sy2);
    const [sx3, sy3] = toScreen(yMax, yMax);
    ctx.lineTo(sx3, sy3);
    ctx.closePath();
    ctx.fill();

    // Draw boundary x = y
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    const [bx1, by1] = toScreen(xMin, xMin);
    const [bx2, by2] = toScreen(yMax, yMax);
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw equality constraint x + 2y = 3
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const y1_eq = (3 - xMin) / 2;
    const y2_eq = (3 - xMax) / 2;
    const [eqx1, eqy1] = toScreen(xMin, y1_eq);
    const [eqx2, eqy2] = toScreen(xMax, y2_eq);
    ctx.moveTo(eqx1, eqy1);
    ctx.lineTo(eqx2, eqy2);
    ctx.stroke();

    // Draw gradient arrows if enabled
    if (showGradients) {
        drawGradientField();
    }

    // Draw unconstrained minimum (0, 0)
    const [umx, umy] = toScreen(0, 0);
    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.arc(umx, umy, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('Unconstrained min (0,0)', umx + 10, umy - 10);

    // Draw optimal point (1, 1)
    const [optx, opty] = toScreen(1, 1);
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(optx, opty, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Optimal (1, 1)', optx + 12, opty - 12);
    ctx.font = '12px Arial';
    ctx.fillText('f(1,1) = 3', optx + 12, opty + 5);
}

function drawContour(level) {
    ctx.beginPath();
    let first = true;

    for (let theta = 0; theta <= 2 * Math.PI; theta += 0.01) {
        // For ellipse x² + 2y² = level
        // Parametric: x = sqrt(level)*cos(θ), y = sqrt(level/2)*sin(θ)
        if (level <= 0) continue;
        const x = Math.sqrt(level) * Math.cos(theta);
        const y = Math.sqrt(level / 2) * Math.sin(theta);
        const [sx, sy] = toScreen(x, y);

        if (first) {
            ctx.moveTo(sx, sy);
            first = false;
        } else {
            ctx.lineTo(sx, sy);
        }
    }
    ctx.closePath();
    ctx.stroke();
}

function drawGradientField() {
    const step = 0.5;
    for (let x = xMin; x <= xMax; x += step) {
        for (let y = yMin; y <= yMax; y += step) {
            // Only draw in feasible region
            if (x > y) continue;

            const [gx, gy] = gradF(x, y);
            const mag = Math.sqrt(gx * gx + gy * gy);
            if (mag < 0.1) continue;

            const scale = 0.15 / mag;
            const dx = -gx * scale;
            const dy = -gy * scale;

            const [sx1, sy1] = toScreen(x, y);
            const [sx2, sy2] = toScreen(x + dx, y + dy);

            ctx.strokeStyle = 'rgba(100, 100, 200, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
            ctx.beginPath();
            ctx.moveTo(sx2, sy2);
            ctx.lineTo(sx2 - 6 * Math.cos(angle - Math.PI / 6), sy2 - 6 * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(sx2, sy2);
            ctx.lineTo(sx2 - 6 * Math.cos(angle + Math.PI / 6), sy2 - 6 * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    }
}

function toggleContours() {
    showContours = !showContours;
    draw();
}

function toggleGradients() {
    showGradients = !showGradients;
    draw();
}

function resetView() {
    showContours = true;
    showGradients = false;
    draw();
}

// Initial draw
draw();
