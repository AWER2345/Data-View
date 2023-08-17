class RaceBarChart {
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
			margin: _config.margin || { top: 25, right: 20, bottom: 54, left: 50 },
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
			.range(['#7bc77e', '#7ba9c7', '#8366a5', '#dff560', '#e77575', '#dcc865'])

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

		vis.svg
			.append("text")
			.attr("class", "chart-title")
			.attr("x", 10)
			.attr("y", 15)
			.style("font-size", "1.5em")
			.style("font-weight", "bold")
			.text("Nationwide Victims' Race grouped by Perpetrator Race");

		vis.svg
			.append('text')
			.attr('class', 'axis-title')
			.attr('y', vis.config.containerHeight - 3)
			.attr('x', vis.config.containerWidth/2)
			.style("font-size", "1em")
      .style("font-weight", "bold")
			.style('text-anchor', 'end')
			.text('Race');
			
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
			.text("Nationwide Victims' Race grouped by Perpetrator Race");
		} else {
			vis.svg.selectAll(".chart-title")
			.join("text")
			.attr("class", "chart-title")
			.attr("x", 10)
			.attr("y", 15)
			.style("font-size", "1.5em")
			.style("font-weight", "bold")
			.text("Victims' Race grouped by Perpetrator Race for " + selectedState);
		}

		let processedData = []
		vis.selectedStateData = vis.data.filter(d => ((selectedState === null || d.State === selectedState) && (d["Execution Date"] <= selectedCutoffYear)));
		
		vis.selectedStateData.forEach(d => {
			let element = {}
			Object.keys(d).forEach(attr => {
				if (attr !== 'Juvenile' && attr !== 'Race' && attr !== 'State' && attr !== 'Sex') {
					element[attr] = +d[attr];
				} else {
					element[attr] = d[attr];
				}
			});
			processedData.push(element);
		});

		vis.selectedStateData = processedData;

		// process data based on race and countOfVicims by race
		const aggregatedDataMap = processData(vis.selectedStateData);

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
		vis.subGroups = ['whiteVictims', 'blackVictims', 'latinxVictims', 'asianVictims', 'nativeAmericanVictims', 'otherVictims'];

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
			let victimsRace = d.key.substring(0, d.key.length - 7);
			victimsRace = victimsRace[0].toUpperCase() + victimsRace.slice(1); // capitalize first letter
			d3
			.select("#tooltip")
			.style("display", "block")
			.style("left", event.pageX + vis.config.tooltipPadding + "px")
			.style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
					<div class="tooltip-title">Victim's Race: ${victimsRace}</div>
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

function processData(data) {
	let groupByRace = d3.group(data, d => d.Race)

	let dataForChart = new Map([
		['White', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }],
		['Black', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }],
		['Latinx', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }],
		['Native', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }],
		['Asian', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }],
		['Other Race', { whiteVictims: 0, blackVictims: 0, latinxVictims: 0, asianVictims: 0, nativeAmericanVictims: 0, otherVictims: 0 }]
	]);

	for (let race of groupByRace.keys()) {
		let currRaceVictims = groupByRace.get(race);
		if (race === "American Indian or Alaska Native") race = "Native"; //Shorten race name to make view cleaner.
		currRaceVictims.forEach((element) => {
			if (element["Number of White Male Victims"] !== 0 || element["Number of White Female Victims"] !== 0) {
				dataForChart.get(race).whiteVictims = dataForChart.get(race).whiteVictims + 1;
			} else if (element["Number of Black Male Victims"] !== 0 || element["Number of Black Female Victims"] !== 0) {
				dataForChart.get(race).blackVictims = dataForChart.get(race).blackVictims + 1;
			} else if (element["Number of Latino Male Victims"] !== 0 || element["Number of Latino Female Victims"] !== 0) {
				dataForChart.get(race).latinxVictims = dataForChart.get(race).latinxVictims + 1;
			} else if (element["Number of Asian Male Victims"] !== 0 || element["Number of Asian Female Victims"] !== 0) {
				dataForChart.get(race).asianVictims = dataForChart.get(race).asianVictims + 1;
			} else if (element["Number of Other Race Male Victims"] !== 0 || element["Number of Other Race Female Victims"] !== 0) {
				dataForChart.get(race).otherVictims = dataForChart.get(race).otherVictims + 1;
			} else if (element["Number of Native American Male Victims"] !== 0 || element["Number of American Indian or Alaska Native Female Victims"] !== 0) {
				dataForChart.get(race).nativeAmericanVictims = dataForChart.get(race).nativeAmericanVictims + 1;
			}
		});


	}
	return dataForChart;
}