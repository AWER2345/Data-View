class ChoroplethMap {

  
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 700,
      containerHeight: _config.containerHeight || 650,
      margin: _config.margin || {top: -275, right: 60, bottom: 0, left: 0},
      tooltipPadding: 10,
      legendBottom: 250,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize projection and path generator
    vis.projection = d3.geoAlbersUsa();
    vis.geoPath = d3.geoPath().projection(vis.projection);

    vis.colorScale = d3.scaleLog()
        .range(['#FFCCCB', '#970a00'])
        .interpolate(d3.interpolateHcl);

    // Initialize gradient that we will later use for the legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", "legend-gradient");

    // Append legend
    vis.legend = vis.chart.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
    
    vis.legendRect = vis.legend.append('rect')
        .attr('width', vis.config.legendRectWidth)
        .attr('height', vis.config.legendRectHeight);

    vis.legendTitle = vis.legend.append('text')
        .attr('class', 'legend-title')
        .attr('dy', '.35em')
        .attr('y', 30)
        .text('Amount of Deaths for each State')
        

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    const deaths2 = d3.extent(vis.data.objects.states.geometries, d => {
      if (d.properties.years) {
        return d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length;
      } else {
        return 1;
      }
    });
    
    // Update color scale
    vis.colorScale.domain([1,deaths2[1]]);
    // Define begin and end of the color gradient (legend)
    vis.legendStops = [
      { color: '#FFCCCB', value: 1, offset: 0},
      { color: '#970a00', value: deaths2[1], offset: 100},
    ];
  //d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length
    vis.renderVis();
  }


  renderVis() {
    let vis = this;

    // Convert compressed TopoJSON to GeoJSON format
    const states = topojson.feature(vis.data, vis.data.objects.states)

    // Defines the scale of the projection so that the geometry fits within the SVG area
    vis.projection.fitSize([vis.width, vis.height], states);

    // Append world map
    const statePath = vis.chart.selectAll('.states')
        .data(states.features)
      .join('path')
        .attr('class', d=> {
          if (selectedState != null && selectedState === d.properties.name){
            return 'state active'
          } else {
            return 'state'
          }
        })
        .attr('d', vis.geoPath)
        .attr('fill', d => {
          
          if (d.properties.years) {
            if (d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length == 0) {
              return '#FFFFFF';
            }
            return vis.colorScale(d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length);
          } else {
            return '#FFFFFF';
          }
        });

        statePath
        .on('mousemove', (event,d) => {
          let deaths;
          if (d.properties.years){
            deaths = d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length ? `<strong>${d.properties.years.filter(d => selectedCutoffYear >= d['Execution Date']).length}</strong> executions` : 'No executions'; 
          } else {
            deaths = "No Executions";
          }
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.properties.name}</div>
              <div>${deaths}</div>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        })
        .on("click", function(event,d) {
          const isActive = d3.select(this).classed('active');
          d3.selectAll('path.state').classed('active',false);
          d3.select(this).classed('active', !isActive);
          if (isActive){
            updateSelectedState(null);
          } else {
            updateSelectedState(d.properties.name);
          }
        });

    // Add legend labels
    vis.legend.selectAll('.legend-label')
        .data(vis.legendStops)
      .join('text')
        .attr('class', 'legend-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('y', 20)
        .attr('x', (d,index) => {
          return index == 0 ? 0 : vis.config.legendRectWidth;
        })
        .text(d => Math.round(d.value * 10 ) / 10);

    // Update gradient for legend
    vis.linearGradient.selectAll('stop')
        .data(vis.legendStops)
      .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    vis.legendRect.attr('fill', 'url(#legend-gradient)');
  }
}