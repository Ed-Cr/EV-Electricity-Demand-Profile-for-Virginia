// charts.js
function computeAverageDemand(evDemandData) {
    const hours = [...Array(24).keys()];
    const averages = hours.map(h => {
        const hourStr = String(h);
        const records = evDemandData.features.filter(f => f.properties["Hour of Da"] === hourStr);
        if (records.length === 0) return 0;
        const total = records.reduce((sum, r) => sum + r.properties.ev_demand, 0);
        return total / records.length;
    });
    return { hours, averages };
}

function initAverageDemandChart(evDemandData) {
    if (!window.evDemandData) return;

    const { hours, averages } = computeAverageDemand(evDemandData);
    const ctx = document.getElementById("avgDemandChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: hours.map(h => h + ":00"),
            datasets: [{
                label: "Avg EV Demand",
                data: averages,
                borderColor: "#ffdd57",
                backgroundColor: "rgba(255,221,87,0.3)",
                fill: true,
                tension: 0.25,
                pointBackgroundColor: "#ffdd57",
                pointBorderColor:"#ffffff",
                pointHoverRadius: 6,

            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: true, 
                    labels: {
                        color: "#ffffff",
                        font: {size: 14}
                }
             } },
             tooltip: {
                callbacks: {
                    label: function(context) {
                        let val = context.raw;
                        return ` ${val.toFixed(2)} kWh`;
                    }
                }
             },
            scales: {
                y: { 
                    ticks: { color: "#ffffff" },
                    grid: { color: "#333333" },
                    title: { display: true, text: "kWh", color: "#ffffff" } },
                x: {                     
                    ticks: { color: "#ffffff" },
                    grid: { color: "#333333" }, }
            }
        }
    });
}

// Compute statewide vehicle totals (HD, MD, LD)
function computeVehicleTotals(evDemandData) {
    let totals = { heavy: 0, medium: 0, light: 0 };
    const counted = new Set();

    evDemandData.features.forEach(f => {
        const county = f.properties.NAMELSAD;
        if (!counted.has(county)) {
            totals.heavy += Number(f.properties.Heavy_Duty) || 0;
            totals.medium += Number(f.properties.Medium_Dut) || 0;
            totals.light += Number(f.properties.Light_Duty) || 0;
            counted.add(county);
        }
    });

    return totals;
}

// Update the number cards in the DOM
function updateVehicleCards(evDemandData) {
    const totals = computeVehicleTotals(evDemandData);

    document.getElementById("heavyDutyCard").textContent = `Heavy Duty: ${totals.heavy.toLocaleString()}`;
    document.getElementById("mediumDutyCard").textContent = `Medium Duty: ${totals.medium.toLocaleString()}`;
    document.getElementById("lightDutyCard").textContent = `Light Duty: ${totals.light.toLocaleString()}`;
}