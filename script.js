let simulationRunning = false;
let paused = false;
let sequence = [];
let currentStep = 0;
const history = [];

function startSimulation() {
    if (simulationRunning) return;
    simulationRunning = true;
    const head = parseInt(document.getElementById('headPosition').value);
    const requestsInput = document.getElementById('requests').value;
    if (!requestsInput) {
        alert('Please enter disk requests!');
        simulationRunning = false;
        return;
    }
    const requests = requestsInput.split(',').map(Number).filter(n => !isNaN(n));
    if (requests.length === 0) {
        alert('Invalid requests format!');
        simulationRunning = false;
        return;
    }
    const algorithm = document.getElementById('algorithm').value;
    document.getElementById('currentAlgo').textContent = algorithm.toUpperCase();
    sequence = simulateAlgorithm(algorithm, head, requests);
    currentStep = 0;
    animateSimulation(head, sequence);
}

function pauseSimulation() {
    paused = true;
}

function resumeSimulation() {
    if (!simulationRunning) return;
    paused = false;
    animateSimulation(parseInt(document.getElementById('headPosition').value), sequence);
}

function resetSimulation() {
    simulationRunning = false;
    paused = false;
    currentStep = 0;
    sequence = [];
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('seekTime').textContent = '0';
    document.getElementById('responseTime').textContent = '0';
    document.getElementById('throughput').textContent = '0';
    document.getElementById('currentAlgo').textContent = 'None';
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, 800, 400);
}

function simulateAlgorithm(algorithm, head, requests) {
    let seq = [...requests];
    switch (algorithm) {
        case 'fcfs':
            return seq;
        case 'sstf':
            return sstf(head, seq);
        case 'ai':
            return seq.sort((a, b) => a - b); // Simulated AI
        default:
            return seq; // Simplified for SCAN, C-SCAN, LOOK
    }
}

function sstf(head, requests) {
    let sequence = [];
    let remaining = [...requests];
    let current = head;
    while (remaining.length > 0) {
        let closest = remaining.reduce((prev, curr) => 
            Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev);
        sequence.push(closest);
        current = closest;
        remaining = remaining.filter(x => x !== closest);
    }
    return sequence;
}

function animateSimulation(head, sequence) {
    if (!simulationRunning || paused || currentStep >= sequence.length) {
        if (currentStep >= sequence.length && sequence.length > 0) {
            updateHistory(sequence);
            simulationRunning = false;
        }
        return;
    }
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 50; // Space for axes
    const plotWidth = canvas.width - 2 * margin;
    const plotHeight = canvas.height - 2 * margin;
    const maxValue = Math.max(head, ...sequence, 200);
    const scaleY = plotHeight / maxValue;
    const stepX = plotWidth / (sequence.length + 1);

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    // X-axis
    ctx.moveTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    // Y-axis
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.stroke();

    // Draw Y-axis scale (head position)
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '12px Arial';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const y = canvas.height - margin - (i * plotHeight / yTicks);
        const value = Math.round((i * maxValue) / yTicks);
        ctx.fillText(value, margin - 40, y + 5);
        ctx.beginPath();
        ctx.moveTo(margin - 5, y);
        ctx.lineTo(margin, y);
        ctx.stroke();
    }

    // Draw X-axis scale (steps)
    ctx.textAlign = 'center';
    for (let i = 0; i <= sequence.length + 1; i++) {
        const x = margin + i * stepX;
        ctx.fillText(i === 0 ? 'Start' : i, x, canvas.height - margin + 20);
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - margin);
        ctx.lineTo(x, canvas.height - margin + 5);
        ctx.stroke();
    }

    // Draw head movement
    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin - head * scaleY);
    let points = [head, ...sequence.slice(0, currentStep + 1)];
    for (let i = 0; i < points.length; i++) {
        let x = margin + i * stepX;
        let y = canvas.height - margin - points[i] * scaleY;
        ctx.lineTo(x, y);
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
    }
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.stroke();

    const seekTime = calculateSeekTime(head, points.slice(1));
    const responseTime = sequence.length > 0 ? (seekTime / sequence.length).toFixed(2) : 0;
    const throughput = points.length - 1;
    document.getElementById('seekTime').textContent = seekTime;
    document.getElementById('responseTime').textContent = responseTime;
    document.getElementById('throughput').textContent = throughput;
    document.getElementById('progress-bar').style.width = `${(currentStep + 1) / sequence.length * 100}%`;

    currentStep++;
    setTimeout(() => requestAnimationFrame(() => animateSimulation(head, sequence)), 500);
}

function calculateSeekTime(head, sequence) {
    if (sequence.length === 0) return 0;
    let total = Math.abs(head - sequence[0]);
    for (let i = 1; i < sequence.length; i++) {
        total += Math.abs(sequence[i] - sequence[i - 1]);
    }
    return total;
}

function updateHistory(sequence) {
    const algo = document.getElementById('algorithm').value;
    const seek = document.getElementById('seekTime').textContent;
    const response = document.getElementById('responseTime').textContent;
    const throughput = document.getElementById('throughput').textContent;
    history.push({ algo, seek, response, throughput });
    const table = document.getElementById('historyTable');
    table.innerHTML = history.map(h => `
        <tr>
            <td>${h.algo.toUpperCase()}</td>
            <td>${h.seek}</td>
            <td>${h.response}</td>
            <td>${h.throughput}</td>
        </tr>`).join('');
}

function saveConfig() {
    const config = {
        head: document.getElementById('headPosition').value,
        requests: document.getElementById('requests').value,
        algorithm: document.getElementById('algorithm').value,
        workload: document.getElementById('workload').value
    };
    localStorage.setItem('diskConfig', JSON.stringify(config));
    alert('Configuration saved!');
}

function loadConfig() {
    const config = JSON.parse(localStorage.getItem('diskConfig'));
    if (config) {
        document.getElementById('headPosition').value = config.head;
        document.getElementById('requests').value = config.requests;
        document.getElementById('algorithm').value = config.algorithm;
        document.getElementById('workload').value = config.workload;
        alert('Configuration loaded!');
    }
}

function showHelp() {
    alert('Use the controls to set parameters and run simulations. Hover over metrics for tooltips!');
}

function showFeedback() {
    const feedback = prompt('Please provide your feedback:');
    if (feedback) alert('Thank you for your feedback!');
}