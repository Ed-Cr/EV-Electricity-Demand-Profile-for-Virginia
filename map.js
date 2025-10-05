// map.js
let map;
let currentLayer;

const homeCoords = [38.5, -79.5];
const homeZoom = 7;

function initMap() {
    map = L.map('mapid').setView(homeCoords, homeZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    addLegend();
    addSlider();
    addHomeButton(homeCoords, homeZoom);

    updateMap("12"); // default hour

    // Initialize total fleet card display
    updateFleetCards(); // shows totals (0 or aggregate)
}

// Add the choropleth layer for a specific hour
function updateMap(hourStr) {
    if (!window.evDemandData) return;

    if (currentLayer) map.removeLayer(currentLayer);

    currentLayer = L.geoJSON(evDemandData, {
        filter: f => f.properties["Hour of Da"] === String(hourStr),
        style: evDemandStyle,
        onEachFeature: (feature, layer) => {
            const safeId = feature.properties.NAMELSAD.replace(/\s+/g, "_");
            const canvasId = "chart_" + safeId;

            // Bind popup content
            layer.bindPopup(`
                <div style="width:100%; max-width:400px;">
                    <strong>${feature.properties.NAMELSAD}</strong><br>
                    EV Demand at ${hourStr}:00 → ${feature.properties.ev_demand} kWh<br>
                    Total Vehicles: ${feature.properties.total_regi}<br>
                    Heavy Duty: ${feature.properties.Heavy_Duty}<br>
                    Medium Duty: ${feature.properties.Medium_Dut}<br>
                    Light Duty: ${feature.properties.Light_Duty}
                    <div style="width:100%; height:220px;">
                        <canvas id="${canvasId}"></canvas>
                    </div>
                </div>
            `, { maxWidth: 450 });

            // When popup opens, render small hourly line chart
            layer.on('popupopen', () => {
                const hours = [...Array(24).keys()];
                const demand = hours.map(h => {
                    const rec = evDemandData.features.find(f2 =>
                        f2.properties.NAMELSAD === feature.properties.NAMELSAD &&
                        f2.properties["Hour of Da"] === String(h)
                    );
                    return rec ? rec.properties.ev_demand : 0;
                });

                const ctx = document.getElementById(canvasId).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: hours.map(h => h + ":00"),
                        datasets: [{
                            label: `EV Demand`,
                            data: demand,
                            borderColor: '#f03b20',
                            backgroundColor: 'rgba(240,59,32,0.2)',
                            fill: true,
                            tension: 0.2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { title: { display: true, text: "kW" } },
                            x: { ticks: { maxRotation: 0, minRotation: 0 } }
                        }
                    }
                });
            });

            // When a county is clicked, update fleet cards dynamically
            layer.on('click', () => {
                const props = feature.properties;
                updateFleetCards(props);
            });
        }
    }).addTo(map);

    // Populate table each time the map updates
    populateCountyTable(evDemandData, hourStr);
}

// Slider functionality
function addSlider() {
    const slider = document.getElementById('myRange');
    const hourLabel = document.getElementById('hour');

    slider.addEventListener('input', () => {
        const hr = slider.value;
        hourLabel.textContent = hr + ":00";
        updateMap(hr);
    });
}

// Function to update the fleet cards dynamically
function updateFleetCards(props = null) { const totalCard  = document.getElementById("totalFleetCard");
    const heavyCard  = document.getElementById("heavyDutyCard");
    const mediumCard = document.getElementById("mediumDutyCard");
    const lightCard  = document.getElementById("lightDutyCard");

    if (!props) {
        // Default state → sum of all counties
        let totalFleet = 0;
        let totalHeavy = 0;
        let totalMedium = 0;
        let totalLight = 0;

        if (window.evDemandData) {
            const counted = new Set();
            window.evDemandData.features.forEach(f => {
                const county = f.properties.NAMELSAD;
                if (!counted.has(county)) {
                    counted.add(county);
                    totalFleet  += Number(f.properties.total_regi) || 0;
                    totalHeavy  += Number(f.properties.Heavy_Duty) || 0;
                    totalMedium += Number(f.properties.Medium_Dut) || 0;
                    totalLight  += Number(f.properties.Light_Duty) || 0;
                }
            });
        }

        totalCard.textContent  = `Total Fleet Vehicles: ${totalFleet.toLocaleString()}`;
        heavyCard.textContent  = `Heavy Duty: ${totalHeavy.toLocaleString()}`;
        mediumCard.textContent = `Medium Duty: ${totalMedium.toLocaleString()}`;
        lightCard.textContent  = `Light Duty: ${totalLight.toLocaleString()}`;

    } else {
        // When a county is clicked → show county values
        totalCard.textContent  = `${props.NAMELSAD}: ${Number(props.total_regi).toLocaleString()}`;
        heavyCard.textContent  = `Heavy Duty: ${Number(props.Heavy_Duty).toLocaleString()}`;
        mediumCard.textContent = `Medium Duty: ${Number(props.Medium_Dut).toLocaleString()}`;
        lightCard.textContent  = `Light Duty: ${Number(props.Light_Duty).toLocaleString()}`;
    }
}

// Legend
function addLegend() {
    const legend = L.control({ position: 'topright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 1, 14, 38, 67, 111, 181];
        for (let i = 0; i < grades.length; i++) {
            const from = grades[i];
            const to = grades[i + 1];
            div.innerHTML +=
                `<i style="background:${getColor(from + 1)}"></i> ${from}${to ? '&ndash;' + to + ' kWh<br>' : '+ kWh'}`;
        }
        return div;
    };
    legend.addTo(map);
}

// Home button
function addHomeButton(homeCoords, homeZoom) {
    const homeControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
            const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
            button.innerHTML = "Reset ⌂";
            button.title = "Reset map view";

            L.DomEvent.on(button, 'click', () => {
                map.setView(homeCoords, homeZoom);
                updateFleetCards();
            });
            
            return button;
        }
    });
    map.addControl(new homeControl());
}