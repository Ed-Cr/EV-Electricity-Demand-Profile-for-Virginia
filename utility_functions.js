// utility_functions.js

// Returns a color for electricity demand
function getColor(d) {
    return d > 111 ? '#bd0026' :
           d >  67 ? '#f03b20' :
           d >  38 ? '#fd8d3c' :
           d >  14 ? '#feb24c' :
           d >   1 ? '#fed976' :
           d >   0 ? '#ffffb2' :
                     '#ffffff';
}

// Style for choropleth layer
function evDemandStyle(feature) {
    return {
        fillColor: getColor(feature.properties.ev_demand),
        weight: 2,
        color: '#000',
        dashArray: '3',
        fillOpacity: 0.5
    };
}

// Sets up functions for the table of county data
function populateCountyTable(evDemandData, hour) {
    const tbody = document.querySelector("#countyDataTable tbody");
    tbody.innerHTML = ""; // clear existing rows

    const counted = new Set(); // track counties already added

    evDemandData.features.forEach(f => {
        const county = f.properties.NAMELSAD;
        const featureHour = String(f.properties["Hour of Da"]);

        // Only add one row per county, using the specified hour
        if (!counted.has(county) && featureHour === String(hour)) {
            counted.add(county);

            const heavy  = Number(f.properties.Heavy_Duty)  || 0;
            const medium = Number(f.properties.Medium_Dut) || 0;
            const light  = Number(f.properties.Light_Duty) || 0;
            const total  = Number(f.properties.total_regi) || 0;
            const demand = Number(f.properties.ev_demand)  || 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${county}</td>
                <td>${heavy.toLocaleString()}</td>
                <td>${medium.toLocaleString()}</td>
                <td>${light.toLocaleString()}</td>
                <td>${total.toLocaleString()}</td>
                <td>${demand.toFixed(2)}</td>
            `;

            tbody.appendChild(row);
        }
    });
}