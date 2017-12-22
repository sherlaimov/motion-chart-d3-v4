/* eslint func-names: ["error", "never"] */
import * as d3 from 'd3';
import chartFactory from './common';

window.d3 = d3;
class MotionChart {
  constructor() {
    this.chart = chartFactory({ id: 'motion-chart' });
    this.width = this.chart.width;
    this.height = this.chart.height;
    this.container = this.chart.container;
    this.legendWidth = (this.width - this.chart.margin.left - this.chart.margin.right) / 8;
    this.chartWidth =
      this.width - this.chart.margin.left - this.chart.margin.right - this.legendWidth;
    this.chartHeight = this.height - this.chart.margin.top - this.chart.margin.bottom;
    this.selection = {};
    this.reset();
  }
  reset() {
    this.container.selectAll('*').remove();
    this.scale(
      d3.scaleLog(),
      d3.scaleLinear(),
      d3.scaleOrdinal(d3.schemeCategory20),
      d3.scaleLinear(),
    );
  }

  data(dataSource, label, x, y, radius, color) {
    this.dataSource = dataSource;
    this.labelData = label;
    console.log(this.labelData);
    this.xData = x;
    this.yData = y;
    this.radiusData = radius;
    this.colorData = color;
  }

  time(start, end) {
    this.startTime = start;
    this.endTime = end;
  }
  scale(x, y, color, grid) {
    this.xScale = x;
    this.xAxis = d3.axisBottom().scale(this.xScale);
    this.yScale = y;
    this.gridScale = grid;
    this.gridAxis = d3.axisBottom().scale(this.gridScale);
    this.yAxis = d3.axisLeft().scale(this.yScale);
    this.radiusScale = d3.scaleSqrt();
    if (color) {
      this.colorScale = color;
    }
  }

  select(label) {
    this.selection[label] = true;
  }
  startTransition() {
    this.timeSliderPlayButton.style('display', 'none');
    this.timeSliderHead.style('display', 'block');
    const startTime = this.startTime.getTime();
    const endTime = this.endTime.getTime();
    const currentTime = this.currentTime.getTime();
    const duration = (endTime - currentTime) * 20000 / (endTime - startTime);
    const timeInterpolator = d3.interpolate(this.currentTime, this.endTime);
    this.container
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .tween('date', () => t => this.update(new Date(timeInterpolator(t))))
      .on('end', () => this.stopTransition());
  }

  stopTransition() {
    if (this.container) {
      this.container.transition().duration(0);
      this.timeSliderHead.style('display', 'none');
      this.timeSliderPlayButton.style('display', 'block');
    }
  }

  createScales() {
    const maxRadius = 40;
    const maxLabelWidth = 40;
    const xDomain = this.computeDomain(this.xData);
    console.log('this.xData', this.xData, xDomain);
    const yDomain = this.computeDomain(this.yData);
    console.log('this.yData', this.yData, yDomain);
    this.radiusDomain = this.computeDomain(this.radiusData);
    console.log('this.radiusData', this.radiusData, this.radiusDomain);
    this.colorDomain = this.computeDomain(this.colorData);
    console.log('this.colorData', this.colorData);
    this.computeTimeDomain();
    const xScale = this.xScale
      .domain(xDomain)
      .range([1.5 * maxRadius, this.chartWidth - 1.5 * maxRadius - maxLabelWidth]);
    this.xScale = this.xScale
      .domain([xScale.invert(0), xScale.invert(this.chartWidth)])
      .range([0, this.chartWidth])
      .clamp(true);

    const gridScale = this.gridScale
      .domain(xDomain)
      .range([1.5 * maxRadius, this.chartWidth - 1.5 * maxRadius - maxLabelWidth]);
    this.gridScale = this.gridScale
      .domain([gridScale.invert(0), gridScale.invert(this.chartWidth)])
      .range([0, this.chartWidth])
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

    console.log('this.colorDomain', this.colorDomain);
    if (this.colorDomain) {
      const gradient = [
        { stop: 0.0, color: '#3e53ff' },
        { stop: 0.33, color: '#2ff076' },
        { stop: 0.5, color: '#d0ff2f' },
        { stop: 0.66, color: '#ffff2f' },
        { stop: 1.0, color: '#ff2f2f' },
      ];
      const linearGradient = this.container
        .append('defs')
        .append('linearGradient')
        .attr('id', 'colorGradient')
        .attr('x2', '1');
      gradient.forEach(d => {
        linearGradient
          .append('stop')
          .attr('offset', d.stop)
          .attr('stop-color', d.color);
      });
      const gradientStops = gradient.map(d => d.stop);
      const gradientColors = gradient.map(d => d.color);
      this.colorScale = d3
        .scaleLinear()
        .domain(gradientStops.map(d3.scaleLinear().domain(this.colorDomain).invert))
        .range(gradientColors);
    }
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
        const dates = item[axis].map(d => d[0]).map(date => MotionChart.createDate(date));
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

  static createDate(date) {
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
    this.createTimeSlider();
    this.createRules();
    this.createItems();
    this.createLegend();
  }
  createRules() {
    const rules = this.container.append('g').classed('rules', true);
    // x & y axis
    rules
      .append('g')
      .classed('axis x', true)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(this.gridAxis.tickSize(2, 0, 2));
    rules
      .append('g')
      .classed('axis y', true)
      .call(this.yAxis.tickSize(2, 0, 2));
    // grid lines
    rules
      .append('g')
      .classed('grid', true)
      .attr('transform', `translate(0, ${this.chartHeight})`)
      .call(
        this.gridAxis.tickSize(-this.chartHeight, 0, -this.chartHeight).tickFormat(value => ''),
      );
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
  createTimeSlider() {
    // const w = this.chartWidth * (this.colorDomain ? 0.32 : 0.64);
    const w = this.chartWidth;
    // const x = width - this.chart.margin.left - w;
    const x = this.chart.margin.left;
    const y = this.chartHeight + 30;
    this.timeScale = d3
      .scaleTime()
      .domain([this.startTime, this.endTime])
      .range([0, w])
      .clamp(true);
    const ticksData = this.colorDomain
      ? [0, 0.25, 0.5, 0.75, 1]
      : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const ticks = ticksData.map(d3.scaleLinear().domain([this.startTime, this.endTime]).invert);
    const timeTicks = [];
    for (let i = 0; i < ticks.length; i++) {
      timeTicks[i] = new Date(ticks[i]);
    }
    const timeAxis = d3
      .axisBottom()
      .scale(this.timeScale)
      .tickSize(11, 0, 11)
      .tickValues(timeTicks)
      .tickFormat(value => value.getFullYear());
    const g = this.container
      .append('g')
      .classed('time-slider', true)
      .attr('transform', `translate( ${0}, ${y + 15})`);
    g
      .append('g')
      .classed('axis slider', true)
      .attr('transform', `translate( 0, 9)`)
      .call(timeAxis);
    const rect = () =>
      g
        .append('rect')
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('y', -2)
        .attr('x', -3)
        .attr('height', 12);

    rect()
      .attr('width', w + 6)
      .style('fill', '#fff');
    this.timeSlider = rect()
      .style('fill', '#ddd')
      .classed('time-slider', true);
    rect()
      .attr('width', w + 6)
      .style('fill', 'none')
      .style('stroke', '#888');

    this.timeSliderPosition = g.append('g').classed('slider-ticker', true);
    this.timeSliderPosition
      .append('line')
      .attr('y2', -12)
      .style('stroke', '#888');
    this.timeSliderPosition
      .append('text')
      .attr('y', -14)
      .attr('text-anchor', 'middle');

    this.timeSliderHead = g
      .append('g')
      .attr('transform', 'translate(0,4)')
      .classed('slider-head', true)
      .attr('pointer-events', 'all')
      .attr('cursor', 'pointer');
    // .attr('cursor', 'ew-resize');
    this.timeSliderHead
      .append('circle')
      .attr('cy', 0)
      .attr('r', 12)
      .style('fill', '#fff')
      .style('stroke', '#888');
    this.timeSliderHead
      .append('polygon')
      .attr('points', '-5,-5 -5,5 5,5, 5 -5')
      .style('fill', '#888');
    this.timeSliderHead
      .append('circle')
      .attr('cy', 2)
      .attr('r', 30)
      .style('fill', 'none')
      .style('opacity', 1);
    this.timeSliderHead.style('display', 'none');
    this.timeSliderHead.on('click', () => this.stopTransition());

    this.timeSliderPlayButton = g
      .append('g')
      .classed('play-button', true)
      // .attr('transform', 'translate(0, 4)')
      .attr('pointer-events', 'all')
      .attr('cursor', 'pointer');
    this.timeSliderPlayButton
      .append('circle')
      .attr('cy', 0)
      .attr('r', 12)
      .style('fill', '#fff')
      .style('stroke', '#888');
    this.timeSliderPlayButton
      .append('circle')
      .attr('cy', 0)
      .attr('r', 20)
      .style('fill', 'none')
      .style('opacity', 1);
    this.timeSliderPlayButton
      .append('polygon')
      .attr('points', '-4,-5 -4,5 6,0')
      .style('fill', '#888');
    this.timeSliderPlayButton.call(
      d3
        .drag()
        .on('start', () => (this.timeSliderDragged = false))
        .on('drag', () => {
          this.timeSliderDragged = true;
          this.stopTransition();
          const date = this.timeScale.invert(d3.event.x);
          this.update(date);
        })
        .on('end', () => {
          if (this.timeSliderDragged && this.endTime.getTime() - this.currentTime.getTime() > 0) {
            this.timeSliderPlayButton.style('display', 'block');
            this.timeSliderHead.style('display', 'none');
          }
        }),
    );
    this.timeSliderPlayButton.on('click', () => this.startTransition());
  }
  updateTimeSlider(date) {
    const x = this.timeScale(date);
    this.timeSlider.attr('width', x + 6);
    this.timeSliderHead.attr('transform', `translate( ${x},4)`);
    this.timeSliderPosition.attr('transform', `translate( ${x}, 0)`);
    this.timeSliderPosition.selectAll('text').text(date.getFullYear());
    this.timeSliderPlayButton.attr('transform', `translate( ${x}, 4)`);
    if (this.endTime.getTime() - date.getTime() <= 0) {
      this.timeSliderHead.style('display', 'block');
      this.timeSliderPlayButton.style('display', 'none');
    }
  }
  createItems() {
    const self = this;
    this.items = this.container
      .append('g')
      .selectAll(null)
      .data(this.dataSource)
      .enter()
      .append('g')
      .classed('element', true)
      .each(function(item, i) {
        const label = item[self.labelData];
        const g = d3.select(this);
        g.classed('selection', self.selection[label]);
        g
          .append('text')
          .classed('label', true)
          .attr('y', 1)
          .text(label);
        g.append('circle').style('fill', () => self.colorScale(i));
      })
      .on('click', function() {
        d3.select(this).classed('selection', !d3.select(this).classed('selection'));
      });
    this.update(this.startTime);
  }

  createLegend() {
    const self = this;
    window.items = this.items;
    const legendRectSize = 15;
    const legendSpacing = 5;
    this.legend = this.container.append('g').classed('legend', true);
    const legendItems = this.legend
      .selectAll('.item')
      .data(this.dataSource)
      .enter()
      .append('g')
      .classed('legend-item', true)
      .attr('transform', (d, i) => `translate(${this.chartWidth + 20}, ${i * 12})`)
      .each(function(item, i) {
        const label = item[self.labelData];
        const g = d3.select(this);
        g
          .append('rect')
          .attr('height', legendRectSize)
          .attr('width', legendRectSize)
          .style('fill', self.colorScale(i));
        g
          .append('text')
          .attr('x', legendRectSize + legendSpacing)
          .attr('y', legendRectSize - legendSpacing)
          .text(label);
      });
    legendItems.on('click', function() {
      const itemName = d3.select(this).data()[0].name;
      self.selectItem(itemName);
    });
  }

  selectItem(name) {
    this.items.filter(item => item.name === name).classed('selection', function() {
      return !d3.select(this).classed('selection');
    });
  }

  static hasValue(item, axis, date) {
    const data = item[axis];
    if (typeof data === 'number' || typeof data === 'string') {
      return true;
    }
    return date >= data.__min && date <= data.__max;
  }

  static computeValue(item, axis, date) {
    const data = item[axis];
    if (!!data && data.constructor && data.call && data.apply) {
      return data(date);
    }
    return data;
  }
  update(date) {
    const self = this;
    this.currentTime = date;
    window.date = this.currentTime;
    this.updateTimeSlider(date);
    this.items.each(function(data) {
      if (
        MotionChart.hasValue(data, self.xData, date) &&
        MotionChart.hasValue(data, self.yData, date) &&
        MotionChart.hasValue(data, self.radiusData, date)
      ) {
        const x = self.xScale(MotionChart.computeValue(data, self.xData, date));
        const y = self.yScale(MotionChart.computeValue(data, self.yData, date));
        const r = MotionChart.computeValue(data, self.radiusData, date);
        const radius = self.radiusScale(r < 0 ? 0 : r);
        const textPosition = 1 + 1.1 * radius;
        d3.select(this).style('display', 'block');
        d3.select(this).attr('transform', `translate( ${x}, ${y})`);
        d3
          .select(this)
          .selectAll('circle')
          .attr('r', radius);
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
  chart.select('Ukraine');
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
