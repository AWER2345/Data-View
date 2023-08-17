class SexBarChart {
	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 * @param {Array}
	 */
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			colorScale: _config.colorScale,
			containerWidth: _config.containerWidth || 450,
			containerHeight: _config.containerHeight || 340,
			margin: _config.margin || { top: 25, right: 50, bottom: 54, left: 40 },
			tooltipPadding: _config.tooltipPadding || 15
		}
		this.data = _data;
		this.dataForChart;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Calculate inner chart size
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.yScale = d3.scaleLinear()
			.range([vis.height, 0]);

		vis.xScale = d3.scaleBand()
			.range([0, vis.width])
			.padding([0.2]);

		vis.xScaleSubgroup = d3.scaleBand()
			.range([0, vis.xScale.bandwidth()])
			.paddingInner(0.2)
			.paddingOuter(0.1);

		vis.colorScale = d3.scaleOrdinal()
			.range(['#6595dc', '#dc65aa'])

		// Initialize axes
		vis.xAxis = d3.axisBottom(vis.xScale)
			.tickSizeOuter(0)
			.tickSizeInner(0);

		vis.yAxis = d3.axisLeft(vis.yScale)
			.ticks(3)
			.tickSize(0);

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement)
			.attr("height", vis.config.containerHeight)
			.attr("width", vis.config.containerWidth);

		// append main chart group
		vis.barChart = vis.svg.append("g")
			.attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		// append the x and y axis group
		vis.xAxisGroup = vis.barChart.append("g").attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);
    
		vis.yAxisGroup = vis.barChart.append("g").attr("class", "axis y-axis");

		// add axis titles
    vis.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", 10)
      .attr("y", 15)
      .style("font-size", "1.5em")
      .style("font-weight", "bold")
      .text("Nationwide Victims' Sex grouped by Perpetrator Sex");

		vis.svg
			.append('text')
			.attr('class', 'axis-title')
			.attr('y', vis.config.containerHeight - 3)
			.attr('x', vis.config.containerWidth/2)
			.style("font-size", "1em")
      .style("font-weight", "bold")
			.style('text-anchor', 'end')
			.text('Sex');

		vis.yAxisGroup
		.append('text')
		.attr('class', 'axis-title')
		.attr("transform", "rotate(-90)") 
		.attr("y", -vis.config.margin.top + 3) 
		.attr("x", (-vis.height / 2) + 50) 
		.style("font-size", "1em")
		.style("font-weight", "bold")
		.style('text-anchor', 'end')
		.text('Number of Victims');
	}

	updateVis() {
		// Prepare data and scales
		let vis = this;

		// update chart title based on selected state
		if (selectedState === null){
			vis.svg.selectAll(".chart-title")
			.join("text")
			.attr("class", "chart-title")
			.attr("x", 10)
			.attr("y", 15)
			.style("font-size", "1.5em")
			.style("font-weight", "bold")
			.text("Nationwide Victims' Sex grouped by Perpetrator Sex");
		} else {
			vis.svg.selectAll(".chart-title")
			.join("text")
			.attr("class", "chart-title")
			.attr("x", 10)
			.attr("y", 15)
			.style("font-size", "1.5em")
			.style("font-weight", "bold")
			.text("Victims' Sex grouped by Perpetrator Sex for " + selectedState);
		}

		vis.selectedStateData = vis.data.filter(d => ((selectedState === null || d.State === selectedState) && (d["Execution Date"] <= selectedCutoffYear)));

		// process data based on sex and countOfVicims by sex
		const aggregatedDataMap = processSexData(vis.selectedStateData);

		// convert processed map to array
		vis.dataForChart = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));
		vis.groups = [];
		let maxY = 1;
		vis.dataForChart.forEach((element) => {
			vis.groups.push(element.key);
			let arr = Object.values(element.count);
			if (d3.max(arr) > maxY) maxY = d3.max(arr);
		});
		// populate the subgroups
		vis.subGroups = ['maleVictims', 'femaleVictims'];

		vis.xScale.domain(vis.groups);
		vis.yScale.domain([0, maxY]);
		vis.xScaleSubgroup.domain(vis.subGroups);
		vis.xScaleSubgroup.range([0, vis.xScale.bandwidth()])

		vis.renderVis();
	}

	renderVis() {
    let vis = this;

		// Add rectangles
		const bars = vis.barChart.selectAll('.barGroups')
		.data(vis.dataForChart)
		.join('g')
			.attr('class', 'barGroups')
			.attr("transform", function(d) { return "translate(" + vis.xScale(d.key) + ",0)"; });
		
		// group victims by the race of perpretator and plot
		const clusteredBars = bars.selectAll('.bar')
		.data(function(d) { return vis.subGroups.map(function(key) { return {key: key, value: d.count[key]}; }); })
		.join('rect')
		.attr('class', 'bar')
		.attr("x", function(d) { return vis.xScaleSubgroup(d.key); })
		.attr("y", function(d) { return vis.yScale(d.value); })
		.attr("width", vis.xScaleSubgroup.bandwidth())
		.attr("height", function(d) { return vis.height - vis.yScale(d.value); })
		.attr("fill", function(d) { return vis.colorScale(d.key); });

		// add tooltips on hover
		clusteredBars
    .on("mouseover", function(event, d) {
			let victimsSex = d.key.substring(0, d.key.length - 7);
			victimsSex = victimsSex[0].toUpperCase() + victimsSex.slice(1); // capitalize first letter
			d3
			.select("#tooltip")
			.style("display", "block")
			.style("left", event.pageX + vis.config.tooltipPadding + "px")
			.style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
					<div class="tooltip-title">Victim's Sex: ${victimsSex}</div>
					<div><i>${d.value} victims</i></div>
				`);
    })
    .on("mouseleave", () => {
      d3.select("#tooltip").style("display", "none");
    });

		// Update axes and remove axis lines
		vis.xAxisGroup.call(vis.xAxis);
		vis.yAxisGroup.call(vis.yAxis);
		vis.xAxisGroup.selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");
	}
}

function processSexData(data) {
	let groupBySex = d3.group(data, d => d.Sex)

	let dataForChart = new Map([
		['Male', { maleVictims: 0, femaleVictims: 0}],
		['Female', { maleVictims: 0, femaleVictims: 0}]
	]);

	for (let sex of groupBySex.keys()) {
		let currSexVictims = groupBySex.get(sex);
		currSexVictims.forEach((element) => {
			if (element["Number of White Male Victims"] != 0 || element["Number of Black Male Victims"] != 0 || 
				element["Number of Latino Male Victims"] != 0 || element["Number of Asian Male Victims"] != 0 || 
				element["Number of Other Race Male Victims"] != 0 || element["Number of Native American Male Victims"] != 0){
					dataForChart.get(sex).maleVictims = dataForChart.get(sex).maleVictims + 1;
				} else {
					dataForChart.get(sex).femaleVictims = dataForChart.get(sex).femaleVictims + 1;
				}
		});
	}
	return dataForChart;
}