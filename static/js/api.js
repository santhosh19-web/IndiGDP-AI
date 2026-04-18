let gdpChartInstance = null;

async function predictGDP() {
    const loader = document.getElementById("loader");
    const resultBox = document.getElementById("resultBox");

    const data = {
        inflation: document.getElementById("inflation").value,
        population: document.getElementById("population").value,
        exports: document.getElementById("exports").value,
        imports: document.getElementById("imports").value,
        fdi: document.getElementById("fdi").value,
        savings: document.getElementById("savings").value
    };

    if(!validateInputs(data)){
        resultBox.innerHTML="⚠ Invalid Inputs";
        return;
    }

    const statusEl = document.getElementById("status");
    
    loader.style.display="block";
    resultBox.innerHTML="";
    statusEl.innerHTML = "Running";
    statusEl.classList.add("status-running");
    
    // Hide placeholder and show canvas (or keep hidden until data arrives)
    document.getElementById("chartPlaceholder").style.display = "none";
    document.getElementById("gdpChart").style.display = "block";

    try {
        const response = await fetch("/api/predict",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(data)
        });

        const res = await response.json();
        
        if(res.error) throw new Error(res.error);

        loader.style.display="none";
        localStorage.setItem("gdp", res.predicted_gdp);

        resultBox.innerHTML = `Predicted GDP: ${res.predicted_gdp} ${res.unit} ✅`;
        statusEl.innerHTML = "Ready";
        statusEl.classList.remove("status-running");

        drawChart(res.predicted_gdp, data);
        
    } catch (e) {
        loader.style.display="none";
        resultBox.innerHTML = `Error: ${e.message}`;
        statusEl.innerHTML = "Ready";
        statusEl.classList.remove("status-running");
    }
}

async function syncMarketData() {
    const syncBtn = document.getElementById("syncBtn");
    const statusEl = document.getElementById("status");
    const resultBox = document.getElementById("resultBox");
    const sentimentEl = document.getElementById("marketSentiment");

    syncBtn.classList.add("loading");
    syncBtn.disabled = true;
    statusEl.innerHTML = "Fetching 5-Year Market Trends...";
    statusEl.classList.add("status-running");

    const INDICATORS = {
        inflation: "FP.CPI.TOTL.ZG",
        population: "SP.POP.TOTL",
        exports: "NE.EXP.GNFS.CD",
        imports: "NE.IMP.GNFS.CD",
        fdi: "BX.KLT.DINV.CD.WD",
        savings: "NY.GNS.ICTR.ZS"
    };

    try {
        const fetchPromises = Object.entries(INDICATORS).map(async ([key, id]) => {
            // Fetch 5 years to build a trend line
            const response = await fetch(`https://api.worldbank.org/v2/country/IN/indicator/${id}?format=json&per_page=5`);
            const data = await response.json();
            
            if (data && data[1]) {
                // World Bank returns data latest first. We want earliest first for charts.
                const history = data[1].filter(d => d.value !== null).reverse();
                return { key, history };
            }
            return { key, history: [] };
        });

        const results = await Promise.all(fetchPromises);
        let bullishCount = 0;

        results.forEach(res => {
            if (res.history.length > 0) {
                const latestData = res.history[res.history.length - 1];
                const prevData = res.history.length > 1 ? res.history[res.history.length - 2] : null;
                
                let latestVal = latestData.value;
                if (["population", "exports", "imports", "fdi"].includes(res.key)) {
                    latestVal = latestVal / 1000000000;
                }
                
                // Update Slider
                const slider = document.getElementById(res.key);
                const output = document.getElementById(res.key + "Value");
                if (slider) {
                    slider.value = latestVal.toFixed(2);
                    if (output) output.innerHTML = latestVal.toFixed(2);
                }

                // Update Trend Indicator
                const trendEl = document.getElementById(res.key + "Trend");
                if (trendEl && prevData) {
                    const diff = latestData.value - prevData.value;
                    const pct = (diff / Math.abs(prevData.value)) * 100;
                    const isUp = diff > 0;
                    
                    trendEl.className = "trend-hint " + (isUp ? "trend-up" : "trend-down");
                    trendEl.innerHTML = (isUp ? "↑ " : "↓ ") + Math.abs(pct).toFixed(1) + "%";

                    // Simple Sentiment Logic
                    if (res.key === "fdi" && isUp) bullishCount++;
                    if (res.key === "exports" && isUp) bullishCount++;
                    if (res.key === "inflation" && !isUp) bullishCount++;
                    if (res.key === "savings" && isUp) bullishCount++;
                }

                // Render Sparkline
                renderSparkline(res.key + "Sparkline", res.history.map(d => d.value));
            }
        });

        // Update Global Sentiment
        if (bullishCount >= 3) {
            sentimentEl.innerHTML = "Bullish 📈";
            sentimentEl.style.color = "#10b981";
        } else if (bullishCount <= 1) {
            sentimentEl.innerHTML = "Bearish 📉";
            sentimentEl.style.color = "#ef4444";
        } else {
            sentimentEl.innerHTML = "Stable ⚖";
            sentimentEl.style.color = "var(--text-primary)";
        }

        resultBox.innerHTML = "✅ Historical market insights synced successfully.";
        setTimeout(() => { if(resultBox.innerHTML.includes("synced")) resultBox.innerHTML = ""; }, 5000);

    } catch (error) {
        console.error("Sync failed:", error);
        resultBox.innerHTML = "⚠ API connection error. Please try again.";
    } finally {
        syncBtn.classList.remove("loading");
        syncBtn.disabled = false;
        statusEl.innerHTML = "Ready";
        statusEl.classList.remove("status-running");
    }
}

let sparklineCharts = {};

function renderSparkline(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (sparklineCharts[canvasId]) {
        sparklineCharts[canvasId].destroy();
    }

    const isDark = document.body.classList.contains("dark-mode");
    const accentColor = isDark ? "#ffffff" : "#000000";

    sparklineCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                data: data,
                borderColor: accentColor,
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

function drawChart(predictedGDP, inputs) {
    const ctx = document.getElementById('gdpChart').getContext('2d');
    
    // Destroy previous chart instance if it exists to allow re-rendering
    if (gdpChartInstance) {
        gdpChartInstance.destroy();
    }

    // Checking if dark mode for chart styling
    const isDark = document.body.classList.contains("dark-mode");
    const textColor = isDark ? "#f9fafb" : "#111827";
    const gridColor = isDark ? "#1f2937" : "#e5e7eb";

    gdpChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Predicted GDP', 'Baseline Target (3.0T)', 'Optimistic Target (5.0T)'],
            datasets: [{
                label: 'GDP in Trillion USD',
                data: [predictedGDP, 3.0, 5.0],
                backgroundColor: [
                    isDark ? '#ffffff' : '#000000',
                    isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'
                ],
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart',
                delay: (context) => {
                    let delay = 0;
                    if (context.type === 'data' && context.mode === 'default' && !context.active) {
                        delay = context.dataIndex * 400; // Staggered delay for each bar
                    }
                    return delay;
                }
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Trillion USD', color: textColor },
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}
