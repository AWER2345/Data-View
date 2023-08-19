class SexPieChart {
	/**
	 * Class constructor with initial configuration
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
		this.sex = ['Male', 'Female'];
		this.initVis();
	}

  initVis() {
		let vis = this;

    // Calculate inner chart size
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
    .attr("height", vis.config.containerHeight)
    .attr("width", vis.config.containerWidth);

		vis.colorScale = d3.scaleOrdinal()
			.range(['#6595dc', '#dc65aa'])

    // append main chart group
		vis.pieChart = vis.svg.append('g')
			.attr('transform', `translate(${vis.width / 2 + vis.config.margin.left},${vis.height / 2 + vis.config.margin.top})`);
    
    vis.radius = Math.min(vis.width, vis.height) / 2;

		vis.svg
			.append("text")
			.attr("class", "chart-title axis-title")
			.attr("x", 10)
			.attr("y", 10)
			.style("font-size", "1.25em")
			.style("font-weight", "bold")
			.text("Victim's Sex");
	}

	updateVis() {
    let vis = this;

		vis.numExecutionsBySex = {};
    vis.numTotalExecutions = 0;

    vis.data.filter(d => ((selectedState === null || d.State === selectedState) && (d["Execution Date"] <= selectedCutoffYear))).forEach(d => {
      if (Object.keys(vis.numExecutionsBySex).includes(d.Sex)) {
        vis.numExecutionsBySex[d.Sex] += 1;
      } else {
        vis.numExecutionsBySex[d.Sex] = 1;
      }
      vis.numTotalExecutions++;
    });

		const pie = d3.pie().value(function(d) {return d[1]})

    vis.dataForChart = pie(vis.sex.map(r =>
      [r, Object.keys(vis.numExecutionsBySex).includes(r) ? vis.numExecutionsBySex[r] : 0]));
    vis.renderVis();
	}

	renderVis() {
    let vis = this;

		const arcGenerator = d3.arc()
			.innerRadius(0)
			.outerRadius(vis.radius);

		const pie = vis.pieChart.selectAll('.pies')
			.data(vis.dataForChart)
		.join('path')
			.attr('class', 'pies')
			.attr('d', arcGenerator)
			.attr('fill', function(d){ return(vis.colorScale(d['data'][0])) })
			.style("opacity", 0.7);

		pie
    .on("mouseover", function(event, d) {
			d3
			.select("#tooltip")
			.style("display", "block")
			.style("left", event.pageX + vis.config.tooltipPadding + "px")
			.style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
					<div class="tooltip-title">${d.data[1]} ${d.data[0]} Executions</div>
          <div><i>${(d.data[1]/vis.numTotalExecutions*100).toFixed(2) + "%"}</i></div>
				`);
    })
    .on("mouseleave", () => {
      d3.select("#tooltip").style("display", "none");
    });

		vis.pieChart.selectAll('.label')
      .data(vis.dataForChart)
      .join('text')
      .text(d => d.data[1] > vis.numTotalExecutions / 2 ? d.data[0] + ": " + (d.data[1]/vis.numTotalExecutions*100).toFixed(2) + "%" : '')
      .attr('class', 'label')
      .attr('transform', function (d) { return 'translate(' + arcGenerator.centroid(d) + ')'; })
      .style('text-anchor', 'middle')
			.style("font-size", "1.25em");
	}
}
