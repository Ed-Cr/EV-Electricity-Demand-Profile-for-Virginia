// Where the different pieces of the dashboard initialize
// dashboard_ui.js
function initDashboard() {
    if (!window.evDemandData) {
        console.error("evDemandData is not loaded!");
        return;
    }

    initMap(); // map + slider
    const defaultHour = 12;
    initAverageDemandChart(evDemandData); // right-column chart
    updateVehicleCards(evDemandData);
    populateCountyTable(evDemandData, defaultHour);
}