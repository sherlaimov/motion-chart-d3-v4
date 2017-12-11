import * as d3 from 'd3';
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
    // this.stopTransition();
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
    this.radiusScale = d3.scaleSqrt();
    if (color) {
      this.colorScale = color;
    }
  }

  createScales() {
    const maxRadius = 20;
    const maxLabelWidth = 40;
    const xDomain = this.computeDomain(this.xData);
    console.log(this.xData);
    const yDomain = this.computeDomain(this.yData);
    this.radiusDomain = this.computeDomain(this.radiusData);
    console.log(this.radiusDomain);
    // this.colorDomain = this.computeDomain(this.colorData);
    // this.computeTimeDomain();
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
      // console.log(item[axis]);
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
  computeTimeDomain() {
    let startTime = this.startTime;
    let endTime = this.endTime;
    const axes = [this.xData, this.yData, this.radiusData, this.colorData];
    axes.forEach(axis => {
      this.dataSource.forEach(item => {
        const data = item[axis];
        // ******************* //
        window._d = data;
        if (!(typeof data === 'number') && !(typeof data === 'string')) {
          data.domain().forEach(value => {
            if (!this.startTime && (!startTime || startTime > value)) {
              startTime = value;
            }
            if (!this.endTime && (!endTime || endTime < value)) {
              endTime = value;
            }
          });
        }
      });
    });
    this.startTime = startTime;
    this.endTime = endTime;
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
  createItems() {
    this.items = this.svg
      .append('g')
      .selectAll('.item')
      .data(this.dataSource)
      .enter()
      .append('g')
      .classed('element', true)
      .each(function(item) {
        const label = item[this.labelData];
        const g = d3.select(this);
        console.log(label);
        // g.classed('selection', self._selection[label]);
        g
          .append('text')
          .classed('label', true)
          .attr('y', 1)
          .text(label);
        g.append('circle');
      });
    // .on('click', function() {
    //   d3.select(this).classed('selection', !d3.select(this).classed('selection'));
    // });
    this.update(this.startTime);
  }
  hasValue(item, axis, date) {
    const data = item[axis];
    // console.log(item);
    if (typeof data === 'number' || typeof data === 'string') {
      return true;
    }
    return date >= data.__min && date <= data.__max;
  }

  computeValue(item, axis, date) {
    const data = item[axis];
    if (!!data && data.constructor && data.call && data.apply) {
      return data(date);
    }
    return data;
  }
  update(date) {
    const self = this;
    this.currentTime = date;
    // this.updateTimeSlider(date);
    this.items.each(function(data) {
      if (
        self.hasValue(data, self.xData, date) &&
        self.hasValue(data, self.yData, date) &&
        self.hasValue(data, self.radiusData, date)
      ) {
        const x = self.xScale(self.computeValue(data, self.xData, date));
        const y = self.yScale(self.computeValue(data, self.yData, date));
        const r = self.computeValue(data, self.radiusData, date);
        const radius = self.radiusScale(r < 0 ? 0 : r);
        // const color = this.hasValue(data, this.colorData, date)
        //   ? this.colorScale(this.computeValue(data, this.colorData, date))
        //   : '#fff';
        const textPosition = 1 + 1.1 * radius;
        d3.select(this).style('display', 'block');
        d3.select(this).attr('transform', `translate( ${x}, ${y})`);
        d3
          .select(this)
          .selectAll('circle')
          .attr('r', radius)
          .style('fill', '#000');
        d3
          .select(this)
          .selectAll('text')
          .attr('transform', `translate( ${textPosition}, 0)`);
      } else {
        d3.select(this).style('display', 'none');
      }
    });
    this.items.sort((a, b) => b[this.radiusData] - a[this.radiusData]);
  }
}

const selector = document.getElementById('selector');
const chart = new MotionChart();

function update(_data) {
  const data = _data;
  const axes = selector.options[selector.selectedIndex].value.split(',').map(text => text.trim());
  console.log(axes);
  chart.reset();
  console.log(data);
  // axes = ["Annual Revenue", "Annual Income", "Shareholder Equity", "Market Capitalization"]
  chart.data(data, 'name', axes[0], axes[1], axes[2], 'population');
  chart.time(new Date('1800/1/1'), new Date('2009/1/1'));
  // chart.select('Apple');
  // chart.select('Google');
  // chart.select('Microsoft');
  chart.draw();
  // chart.startTransition();
}

const fetchData = () => {
  fetch('../data/nations.json')
    .then(res => res.json())
    .then(data => data)
    .then(data => update(data))
    .catch(e => console.log(e));
};

fetchData();
selector.addEventListener('change', () => {
  fetchData();
});
