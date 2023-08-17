// update selectedState and call lineChart.updateVis()
// set to null to show nationwide data
let selectedState = null;
let selectedCutoffYear = 2023;
let lineChart;

/**
 * Load TopoJSON data of the world and the data of the world wonders
 */
Promise.all([
  d3.json('data/states1.json'),
  d3.csv('data/execution_data.csv')
]).then(data => {
  const geoData = data[0];
  const groupData = d3.group(data[1], d => d.State);
  const ageGroup = d3.group(data[1], d => d.Juvenile);

  let old = 0;
  let young = 0;

  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.states.geometries.forEach(d => {
    for (let [key, value] of groupData) {
      if (d.properties.name == key) {
        d.properties.deaths = +value.length;
        for (let value1 of value) {
         
          if (value1.Juvenile == "no") {
            old = old + 1;
          } else {
            young = young + 1;
          }
        }
        
        d.properties.years = value;
        d.properties.old = +old;
        d.properties.young = +young;
        old = 0;
        young = 0;
      }
    }

  });

  const choroplethMap = new ChoroplethMap({ 
    parentElement: '#map'
  }, data[0]);
  
  agePieChart = new AgePieChart({ 
    parentElement: '#piechart'
  }, data[1]);
  agePieChart.updateVis();

  lineChart = new LineChart({
    parentElement: '#lineChartVis',
  }, data[1]);
  lineChart.updateVis();

  racePieChart = new RacePieChart({
    parentElement: '#racePieChartVis',
  }, data[1]);
  racePieChart.updateVis();

  d3.select('#slider').on('input', function() {
    selectedCutoffYear = this.value;
    document.getElementById('mapTitle').innerHTML = "US Map of Executions [1977 - " + selectedCutoffYear + "]";
    choroplethMap.updateVis();
    lineChart.updateVis();
    raceBarChart.updateVis();
    sexBarChart.updateVis();
    sexPieChart.updateVis();
    racePieChart.updateVis();
    agePieChart.updateVis();
  });


  // initialize views
  raceBarChart = new RaceBarChart({parentElement: '#race-bar-chart'}, data[1]);
  raceBarChart.updateVis();
  
  sexBarChart = new SexBarChart({parentElement: '#sex-bar-chart'}, data[1]);
  sexBarChart.updateVis();
  
  sexPieChart = new SexPieChart({parentElement: '#sex-pie-chart'}, data[1]);
  sexPieChart.updateVis();

}).catch(error => console.error(error));

function updateSelectedState(currentState) {
  selectedState = currentState;
  lineChart.updateVis();
  raceBarChart.updateVis();
  sexBarChart.updateVis();
  sexPieChart.updateVis();
  racePieChart.updateVis();
  agePieChart.updateVis();
}
