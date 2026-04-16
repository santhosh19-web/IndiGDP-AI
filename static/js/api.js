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
