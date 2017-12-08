import d3 from 'd3';
import chartFactory from './common';

class MotionChart {
  constructor() {
    this.chart = chartFactory();
    this.width = this.chart.width;
    this.height = this.chart.height;
    this.svg = this.chart.svg;
    this.chartWidth = this.width - this.chart.margin.left - this.chart.margin.right;
    this.chartHeight = this.height - this.chart.margin.top - this.chart.margin.bottom;
    this.reset();
  }
  reset() {
    this.stopTransition();
    this.svg.selectAll('*').remove();
    this.scale(d3.scaleLinear(), d3.scaleLinear(), null);
  }

  data(dataSource, label, x, y, radius, color) {
    this.dataSource = dataSource;
    this.labelData = label;
    this.xData = x;
    this.yData = y;
    this.radiusData = radius;
    this.colorData = color;
  }

  time(start, end) {
    this.startTime = start;
    this.endTime = end;
  }
  scale(x, y, color) {
    this.xScale = x;
    this.xAxis = d3.axisBottom().scale(this.xScale);
    this.yScale = y;
    this.yAxis = d3.axisLeft().scale(this.yScale);
    if (color) {
      this.colorScale = color;
    }
  }

  createScales() {
    const maxRadius = 20;
    const maxLabelWidth = 40;
    const xDomain = this.computeDomain(this.xData);
    const yDomain = this.computeDomain(this.yData);
    this.radiusDomain = this.computeDomain(this.radiusData);
    this.colorDomain = this.computeDomain(this.colorData);
    this.computeTimeDomain();
    const xScale = this.xScale
      .domain(xDomain)
      .range([1.5 * maxRadius, this.width - 1.5 * maxRadius - maxLabelWidth]);
    this.xScale = this.xScale
      .domain([xScale.invert(0), xScale.invert(this.width)])
      .range([0, this.width])
      .clamp(true);
    const yScale = this.yScale
      .domain(yDomain)
      .range([1.5 * maxRadius, this.chartHeight - 1.5 * maxRadius]);
    this.yScale = this.yScale
      .domain([yScale.invert(0), yScale.invert(this.chartHeight)])
      .range([this.chartHeight, 0])
      .clamp(true);
    this.radiusScale = this.radiusScale
      .domain([0, this.radiusDomain[1]])
      .range([2, maxRadius])
      .clamp(true);
  }

  computeDomain(axis) {
    let hasValue = true;
    this.dataSource.forEach(item => {
      if (!(item[axis] instanceof Array) || typeof item[axis] === 'number') {
        console.log('UGH');
      }
      hasValue = (hasValue && item[axis] instanceof Array) || typeof item[axis] === 'number';
    });
    if (!hasValue) {
      return null;
    }
    const min = d3.min(
      this.dataSource,
      item => (typeof item[axis] === 'number' ? item[axis] : d3.min(item[axis], pair => pair[1])),
    );
    const max = d3.max(
      this.dataSource,
      item => (typeof item[axis] === 'number' ? item[axis] : d3.max(item[axis], pair => pair[1])),
    );
    this.dataSource.forEach(item => {
      // Convert time series into a multi-value D3 scale and cache time range.
      if (item[axis] instanceof Array) {
        const dates = item[axis].map(d => d[0]).map(date => this.createDate(date));
        const values = item[axis].map(d => d[1]);

        if (this.endTime && dates[dates.length - 1] < this.endTime) {
          dates.push(this.endTime);
          values.push(values[values.length - 1]);
        }
        item[axis] = d3
          .scaleTime()
          .domain(dates)
          .range(values);
        item[axis].__min = dates[0];
        item[axis].__max = dates[dates.length - 1];
      }
    });
    return [min, max];
  }
  createDate(date) {
    if (typeof date === 'number') {
      return new Date(date, 0, 1);
    }
    if (typeof date === 'string') {
      return new Date(date);
    }
    return date;
  }
  draw() {
    this.createScales();
    this.createRules();
    this.createItems();
  }
  createRules() {
    const rules = this.svg.append('g').classed('rules', true);
    // x & y axis
    rules
      .append('g')
      .classed('axis', true)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.xAxis.tickSize(2, 0, 2));
    rules
      .append('g')
      .classed('axis', true)
      .call(this.yAxis.tickSize(2, 0, 2));
    // grid lines
    rules
      .append('g')
      .classed('grid', true)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.xAxis.tickSize(-this.chartHeight, 0, -this.chartHeight).tickFormat(value => ''));
    rules
      .append('g')
      .classed('grid', true)
      .call(this.yAxis.tickSize(-this.chartWidth, 0, -this.chartWidth).tickFormat(value => ''));
    rules
      .selectAll('.grid line')
      .filter(d => d === 0)
      .classed('origin', true);
    // add axis labels
    rules
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', this.chartWidth - 3)
      .attr('y', this.chartHeight - 6)
      .text(this.xData);
    rules
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', '-3')
      .attr('y', 11)
      .attr('transform', 'rotate(-90)')
      .text(this.yData);
  }
}
