class LineChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 350,
            margin: _config.margin || {
                top: 25,
                right: 30,
                bottom: 50,
                left: 60
            },
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        const vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10)
            .tickFormat(d => +d);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(4)
            .tickSizeOuter(0)
            .tickPadding(10);

        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.lines = vis.chart.append('g');

        vis.tooltipDisplayableRegion = vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height + vis.config.margin.top + 15)
            .attr('x', 366)
            .style('text-anchor', 'end')
            .style("font-size", "1em")
            .style('font-weight', 'bold')
            .text('Year');

        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', -40)
            .attr('x', -vis.height / 3.5)
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'end')
            .style("font-size", "1em")
            .style('font-weight', 'bold')
            .text('Number of Executions');

        vis.tooltip = d3.select('#tooltip');

        vis.hoverCircle = vis.chart.append('circle')
            .attr('r', 4)
            .attr('fill', 'none')
            .attr('stroke', 'none');

        vis.bisectYear = d3.bisector(d => d.year).left;
    }

    updateVis() {
        const vis = this;

        vis.numExecutionsByYear = {}
        vis.numYearlyExecutionsArray = [];

        vis.data.filter(d => (selectedState === null || d.State === selectedState)).forEach(d => {
            if (Object.keys(vis.numExecutionsByYear).includes(d['Execution Date'])) {
                vis.numExecutionsByYear[d['Execution Date']] += 1;
            } else {
                vis.numExecutionsByYear[d['Execution Date']] = 1;
            }
        });

        for (let year = 1977; year <= 2023; year++) {
            vis.numYearlyExecutionsArray.push(
                {
                    "year": year,
                    "count": vis.numExecutionsByYear[year] !== undefined ? vis.numExecutionsByYear[year] : 0
                }
            )
        }

        vis.xValue = d => d.year
        vis.yValue = d => d.count

        vis.line = d3.line()
            .x(d => vis.xScale(vis.xValue(d)))
            .y(d => vis.yScale(vis.yValue(d)));

        vis.xScale.domain(d3.extent(vis.numYearlyExecutionsArray, vis.xValue));
        vis.yScale.domain(d3.extent(vis.numYearlyExecutionsArray, vis.yValue));

        document.getElementById('lineChartTitle').innerText = selectedState === null ? 'Nationwide Executions' :
            'Executions in ' + selectedState;

        vis.renderVis();
    }

    renderVis() {
        const vis = this;

        vis.tooltipDisplayableRegion
            .on('mouseenter', () => {
                vis.tooltip.style('display', 'block');
                vis.hoverCircle
                    .attr('stroke', 'dimgrey')
                    .style('display', 'block');
            })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
                vis.hoverCircle.style('display', 'none');
            })
            .on('mousemove', (event) => {
                let xPos = event.offsetX - vis.config.margin.left;
                console.log(xPos)
                let year = vis.xScale.invert(xPos);
                let index = vis.bisectYear(vis.numYearlyExecutionsArray, year, 1);
                let leftData = vis.numYearlyExecutionsArray[index - 1];
                let rightData = vis.numYearlyExecutionsArray[index];
                let closerData = (year - leftData.year) > (rightData.year - year) ?
                    rightData : leftData;

                vis.tooltip
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                      <div class="tooltip-title">${closerData.year}</div>
                      <div style="font-style: italic">${closerData.count} executions</div>
                    `)

                vis.hoverCircle
                    .attr('transform', `translate(${vis.xScale(closerData.year)},${vis.yScale(closerData.count)})`);
            });

        let numYearlyExecutionsUntilCutoffYear = []
        let numYearlyExecutionsBeyondCutoffYear = [];

        vis.numYearlyExecutionsArray.forEach(d => {
            if (d.year <= selectedCutoffYear) {
                numYearlyExecutionsUntilCutoffYear.push(d);
            }
            if (d.year >= selectedCutoffYear) {
                numYearlyExecutionsBeyondCutoffYear.push(d);
            }
        });

        vis.lines.selectAll('#in-range-line')
            .data([numYearlyExecutionsUntilCutoffYear])
            .join('path')
            .attr('class', 'line')
            .attr('id', 'in-range-line')
            .attr('d', vis.line);

        vis.lines.selectAll('#out-of-range-line')
            .data([numYearlyExecutionsBeyondCutoffYear])
            .join('path')
            .attr('class', 'line')
            .attr('id', 'out-of-range-line')
            .attr('d', vis.line);

        let cutoffYearXCoordinate = vis.xScale(selectedCutoffYear);
        let cutoffYearLineCoordinates = [
            {x: cutoffYearXCoordinate, y: -10},
            {x: cutoffYearXCoordinate, y: 325}
        ];

        let cutoffLine = d3.line()
            .x(d => d.x)
            .y(d => d.y);

        vis.lines.selectAll('#year-end-line')
            .data([cutoffYearLineCoordinates])
            .join('path')
            .attr('class', 'line')
            .attr('id', 'year-end-line')
            .attr('d', cutoffLine);

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }
}