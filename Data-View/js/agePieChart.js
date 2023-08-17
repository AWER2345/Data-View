// Adapted from https://d3-graph-gallery.com/graph/pie_annotation.html
class AgePieChart {

  /**
 * Class constructor with basic configuration
 * @param {Object}
 * @param {Array}
 */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 250,
      containerHeight: _config.containerHeight || 250,
      margin: _config.margin || { top: 10, right: 20, bottom: 10, left: 20 },
      tooltipPadding: _config.tooltipPadding || 15
    }
    this.data = _data;
    this.juvenile = ['no', 'yes'];
    this.initVis();
  }

  initVis() {
    const vis = this;

    vis.colourScale = d3.scaleOrdinal()
      .range(['#2b786c', '#db1d1d'])

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.radius = Math.min(vis.width, vis.height) / 2;

    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(${vis.width / 2 + vis.config.margin.left},${vis.height / 2 + vis.config.margin.top})`);


    vis.pie = d3.pie().value(d => d[1]);

    vis.arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(vis.radius);


    vis.svg
      .append("text")
      .attr("class", "chart-title axis-title")
      .attr("x", 10)
      .attr("y", 10)
      .style("font-size", "1.25em")
      .style("font-weight", "bold")
      .text("Victim's Age");
  }

  updateVis() {
    const vis = this;

    vis.numExecutionsByAge = {};
    vis.numTotalExecutions = 0;
    vis.colourScale.domain(vis.juvenile)

    vis.data.filter(d => ((selectedState === null || d.State === selectedState) && (d["Execution Date"] <= selectedCutoffYear))).forEach(d => {
      if (Object.keys(vis.numExecutionsByAge).includes(d.Juvenile)) {
        vis.numExecutionsByAge[d.Juvenile] += 1;
      } else {
        vis.numExecutionsByAge[d.Juvenile] = 1;
      }
      vis.numTotalExecutions++;
    });
    vis.pieChartData = vis.pie(vis.juvenile.map(r =>
      [r, Object.keys(vis.numExecutionsByAge).includes(r) ? vis.numExecutionsByAge[r] : 0]));
    vis.renderVis();

  }

  renderVis() {
    const vis = this;

    const pie = vis.chart.selectAll('.pies')
      .data(vis.pieChartData)
      .join('path')
      .attr('d', vis.arcGenerator)
      .attr('class', 'pies')
      .attr('fill', d => vis.colourScale(d.data[0]))
      .style('opacity', 0.7);

    pie
    .on("mouseover", function(event, d) {
      d3
      .select("#tooltip")
      .style("display", "block")
      .style("left", event.pageX + vis.config.tooltipPadding + "px")
      .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
          <div class="tooltip-title">${d.data[1]} ${d.data[0] === "yes" ? "Juvenule" : "Adult"} Executions</div>
          <div><i>${(d.data[1]/vis.numTotalExecutions*100).toFixed(2) + "%"}</i></div>
        `);
    })
    .on("mouseleave", () => {
      d3.select("#tooltip").style("display", "none");
    });

    vis.chart.selectAll('.label')
      .data(vis.pieChartData)
      .join('text')
      .text(d => {
        if (d.data[0] == "yes") {
          return d.data[1] > vis.numTotalExecutions / 2 ? "Juvenile : " + (d.data[1]/vis.numTotalExecutions*100).toFixed(2) + "%" : '';
        } else {
          return d.data[1] > vis.numTotalExecutions / 2 ? "Adult : " + (d.data[1]/vis.numTotalExecutions*100).toFixed(2) + "%" : '';
        }
        })
      .attr('class', 'label')
      .attr('transform', function (d) { return 'translate(' + vis.arcGenerator.centroid(d) + ')'; })
      .style('text-anchor', 'middle')
			.style("font-size", "1.25em");
  }
}