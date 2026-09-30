document.addEventListener('DOMContentLoaded', () => {
    console.log("CropGuard Pro Script Loaded - Auth Logic Initializing...");
    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        body.classList.toggle('dark-mode');
        
        // Update Icon
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('light-mode')) {
            icon.className = 'ph ph-sun';
            themeToggle.querySelector('span').textContent = 'Light Mode';
        } else {
            icon.className = 'ph ph-moon';
            themeToggle.querySelector('span').textContent = 'Dark Mode';
        }
        
        // Update Chart colors if it exists
        if (window.liveChart) {
            updateChartTheme();
        }
    });

    // --- ThingSpeak Configuration ---
    const TS_CHANNEL = "3315477";
    const TS_KEY = "1RFPGG06YCM77ONU";
    let lastFetchedTime = null;

    const sensorData = {
        moisture: 0,
        temp: 0,
        humidity: 0,
        water: 0, // Assuming water level might be field 7 or static if not provided
        nitrogen: 0,
        phosphorus: 0,
        potassium: 0,
        health: 0
    };

    function updateUI() {
        // Update simple values
        document.getElementById('val-moisture').textContent = Math.round(sensorData.moisture) || '--';
        document.getElementById('val-temp').textContent = sensorData.temp.toFixed(1) || '--';
        document.getElementById('val-humidity').textContent = Math.round(sensorData.humidity) || '--';
        document.getElementById('val-water').textContent = Math.round(sensorData.water) || '--';
        document.getElementById('val-n').textContent = Math.round(sensorData.nitrogen) || '--';
        document.getElementById('val-p').textContent = Math.round(sensorData.phosphorus) || '--';
        document.getElementById('val-k').textContent = Math.round(sensorData.potassium) || '--';
        document.getElementById('val-health').textContent = Math.round(sensorData.health) + '%';

        // Update Gauge
        const gauge = document.getElementById('moisture-gauge');
        const circumference = 126; 
        const val = Math.min(100, Math.max(0, sensorData.moisture));
        gauge.style.strokeDasharray = `${(val / 100) * circumference}, ${circumference}`;

        // Update Progress Bars
        document.getElementById('humidity-bar').style.width = sensorData.humidity + '%';
        document.getElementById('water-level').style.height = sensorData.water + '%';

        // Update Circular NPK
        document.querySelectorAll('.circular-progress').forEach((el, index) => {
            const keys = ['nitrogen', 'phosphorus', 'potassium'];
            const val = sensorData[keys[index]];
            el.style.setProperty('--progress', val);
        });

        // Update Health Circle
        const healthCircle = document.getElementById('health-circle');
        healthCircle.setAttribute('stroke-dasharray', `${sensorData.health}, 100`);
    }

    async function fetchThingSpeak() {
        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${TS_CHANNEL}/feeds.json?api_key=${TS_KEY}&results=1`);
            const data = await res.json();
            if (data && data.feeds && data.feeds.length > 0) {
                const latest = data.feeds[0];
                
                sensorData.temp = parseFloat(latest.field1) || 0;
                sensorData.humidity = parseFloat(latest.field2) || 0;
                sensorData.moisture = parseFloat(latest.field3) || 0;
                sensorData.nitrogen = parseFloat(latest.field4) || 0;
                sensorData.phosphorus = parseFloat(latest.field5) || 0;
                sensorData.potassium = parseFloat(latest.field6) || 0;
                sensorData.water = parseFloat(latest.field7) || 85; // Fallback to 85 if field 7 not used

                // Calculate a basic health score based on NPK and Moisture
                const moistureScore = (sensorData.moisture > 30 && sensorData.moisture < 80) ? 100 : 50;
                const npkScore = (sensorData.nitrogen + sensorData.phosphorus + sensorData.potassium) / 3;
                sensorData.health = Math.round((moistureScore + npkScore) / 2);
                if (sensorData.health > 100) sensorData.health = 100;

                updateUI();
                updateChartData();
            }
        } catch (e) {
            console.error("ThingSpeak Error:", e);
        }
    }

    function updateChartData() {
        if (!window.liveChart) return;

        const now = new Date();
        const timeLabel = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
        
        const activeToggle = document.querySelector('.toggle.active').getAttribute('data-chart');
        let currentVal = 0;
        if (activeToggle === 'moisture') currentVal = sensorData.moisture;
        else if (activeToggle === 'temp') currentVal = sensorData.temp;
        else if (activeToggle === 'humidity') currentVal = sensorData.humidity;

        window.liveChart.data.labels.push(timeLabel);
        window.liveChart.data.datasets[0].data.push(currentVal);
        
        if (window.liveChart.data.labels.length > 15) {
            window.liveChart.data.labels.shift();
            window.liveChart.data.datasets[0].data.shift();
        }
        window.liveChart.update('none');
    }

    // Interval for fetching real data
    setInterval(fetchThingSpeak, 15000); // ThingSpeak free tier has 15s limit

    // --- Chart.js Integration ---
    const ctx = document.getElementById('liveTimelineChart').getContext('2d');
    
    function initChart() {
        const isDark = !body.classList.contains('light-mode');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        window.liveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(10).fill('').map((_, i) => `0${i}:00`),
                datasets: [{
                    label: 'Soil Moisture %',
                    data: [62, 65, 68, 64, 63, 67, 65, 66, 64, 65],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
                        beginAtZero: true,
                        max: 100
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    function updateChartTheme() {
        const isDark = !body.classList.contains('light-mode');
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        window.liveChart.options.scales.x.ticks.color = textColor;
        window.liveChart.options.scales.y.ticks.color = textColor;
        window.liveChart.options.scales.y.grid.color = gridColor;
        window.liveChart.update();
    }

    // Chart Toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            document.querySelector('.toggle.active').classList.remove('active');
            this.classList.add('active');
            
            const chartType = this.getAttribute('data-chart');
            const dataset = window.liveChart.data.datasets[0];
            
            if (chartType === 'moisture') {
                dataset.label = 'Soil Moisture %';
                dataset.borderColor = '#10b981';
                dataset.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            } else if (chartType === 'temp') {
                dataset.label = 'Temperature °C';
                dataset.borderColor = '#f59e0b';
                dataset.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            } else if (chartType === 'humidity') {
                dataset.label = 'Humidity %';
                dataset.borderColor = '#3b82f6';
                dataset.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }
            window.liveChart.update();
        });
    });

    // Set Current Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // --- Authentication Logic ---
    const API_URL = '/api/auth';

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Toast Notification helper
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                return showToast('Passwords do not match', 'error');
            }

            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                farmName: document.getElementById('farmName').value,
                farmLocation: document.getElementById('farmLocation').value,
                password
            };

            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showToast('Registration successful! Redirecting...');
                    setTimeout(() => window.location.href = 'index.html', 1500);
                } else {
                    showToast(data.message || 'Registration failed', 'error');
                }
            } catch (err) {
                showToast('Server connection failed', 'error');
            }
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showToast('Welcome back! Redirecting...');
                    setTimeout(() => window.location.href = 'index.html', 1500);
                } else {
                    showToast(data.message || 'Login failed', 'error');
                }
            } catch (err) {
                showToast('Server connection failed', 'error');
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Fetch Profile and Personalize Dashboard
    async function loadProfile() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: { 'x-auth-token': token }
            });
            const user = await res.json();
            if (res.ok) {
                updateDashboardWithUser(user);
            } else {
                // Token invalid
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        } catch (err) {
            console.error('Profile fetch failed');
            // Try fallback to local storage if offline
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) updateDashboardWithUser(localUser);
        }
    }

    function updateDashboardWithUser(user) {
        const welcomeMsg = document.getElementById('welcome-message');
        const userNameDisplay = document.getElementById('display-user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (welcomeMsg) welcomeMsg.textContent = `${user.farmName} Command Center`;
        if (userNameDisplay) userNameDisplay.textContent = user.fullName;
        if (userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=10b981&color=fff`;
    }

    // Connection Status Check for Login Page
    const connStatus = document.getElementById('conn-status');
    if (connStatus) {
        async function checkConnection() {
            try {
                const res = await fetch(`${API_URL}/me`, { method: 'GET' });
                // We expect a 401 if not logged in, but that means the server IS alive
                const dot = connStatus.querySelector('.status-dot');
                const text = connStatus.querySelector('.status-text');
                dot.classList.add('online');
                dot.classList.remove('offline');
                text.textContent = 'Backend Online';
            } catch (err) {
                const dot = connStatus.querySelector('.status-dot');
                const text = connStatus.querySelector('.status-text');
                dot.classList.add('offline');
                dot.classList.remove('online');
                text.textContent = 'Backend Offline - Is server running?';
            }
        }
        checkConnection();
        setInterval(checkConnection, 5000);
    }

    // --- Initialization ---
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/CropGuardPro/frontend/' || window.location.pathname === '/') {
        initChart();
        fetchThingSpeak();
        loadProfile();
        updateUI();
    }
});
