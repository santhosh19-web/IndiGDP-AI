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

    loader.style.display="block";
    resultBox.innerHTML="";

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
        document.getElementById("status").innerHTML = "Ready";

        drawChart(res.predicted_gdp, data);
        
    } catch (e) {
        loader.style.display="none";
        resultBox.innerHTML = `Error: ${e.message}`;
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
                duration: 1200,
                easing: 'easeOutQuart'
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
