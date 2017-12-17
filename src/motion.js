import * as d3 from 'd3';
import $ from 'jquery';
import $ui from 'jquery-ui';
import chartFactory from './common';
import interpolateData from './common/interpolate';

window.d3 = d3;

export default function motionChart(data) {
  const chart = chartFactory();
  const { width, height } = chart;

  function x(d) {
    return d.income;
  }
  function y(d) {
    return d.lifeExpectancy;
  }
  function radius(d) {
    return d.population;
  }
  function color(d) {
    return d.region;
  }
  function key(d) {
    return d.name;
  }
  // Positions the dots based on data.
  function position(_data) {
    _data
      .attr('cx', d => xScale(x(d)))
      .attr('cy', d => yScale(y(d)))
      .attr('r', d => {
        console.log(radiusScale(radius(d)));
        return radiusScale(radius(d))});
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }
  // Various scales. These domains make assumptions of data, naturally.
  const xScale = d3
    .scaleLog()
    .domain([300, 100000])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([10, 85])
    .range([height, 0]);

  const radiusScale = d3
    .scaleSqrt()
    .domain([0, 5e8])
    .range([0, 40]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // The x & y axes.
  const xAxis = d3
    .axisBottom(xScale)
    .tickArguments(5)
    .tickFormat(d3.format('.1s'));

  const yAxis = d3.axisLeft(yScale);

  // Add the x-axis.
  chart.container
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  // Add the y-axis.
  chart.container
    .append('g')
    .attr('class', 'y axis')
    .call(yAxis);

  // Add an x-axis label.
  chart.container
    .append('text')
    .attr('class', 'x label')
    .attr('text-anchor', 'end')
    .attr('x', width)
    .attr('y', height - 6)
    .text('income per capita, inflation-adjusted (dollars)');

  // Add a y-axis label.
  chart.container
    .append('text')
    .attr('class', 'y label')
    .attr('text-anchor', 'end')
    .attr('y', 6)
    .attr('dy', '.75em')
    .attr('transform', 'rotate(-90)')
    .text('life expectancy (years)');

  // Add the year label; the value is set on transition.
  const label = chart.container
    .append('text')
    .attr('class', 'year label')
    .attr('text-anchor', 'end')
    .attr('y', height - 24)
    .attr('x', width)
    .text(1800);

  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  const dots = chart.container
    .append('g')
    .attr('class', 'dots')
    .selectAll('.dot')
    .data(interpolateData(1800, data))
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .style('fill', d => colorScale(color(d)))
    .call(position)
    .sort(order);

  // Add a title.
  dots.append('title').text(d => d.name);

  // let playing = false;
  document.querySelector('#play').addEventListener('click', startPlaying);
  document.querySelector('#stop').addEventListener('click', stopPlaying);

  function startPlaying() {
    transition();
  }

  function stopPlaying() {
    chart.container.interrupt('yeah');
  }
  window.pVals = {
    lastTween: 0,
    currTween: null,
    currYear: 1800,
    duration: 209000,
    calRatio() {
      const allWidth = 2009 - 1800;
      const diff = this.currYear - 1800;
      this.lastTween = diff / allWidth;
      return diff / allWidth;
    },
  };

  function transition() {
    const duration = window.pVals.duration - window.pVals.duration * window.pVals.lastTween;
    const year = d3.interpolateNumber(window.pVals.currYear, 2009);
    const t = chart.container
      .transition('yeah')
      .duration(duration)
      .ease(d3.easeLinear)
      .tween('year', () => tween => {
        // tween += window.pVals.lastTween; // was it previously paused?
        window.pVals.currTween = tween;
        window.pVals.currYear = Math.round(year(tween));
        displayYear(year(tween));
      });

    window.trans = t;

    t
      .on('start', () => console.log('Transition started'))
      .on('end', () => console.log('Transition ended'))
      .on('interrupt', () => {
        window.pVals.lastTween = window.pVals.currTween;
        console.log('Transition interrupted');
      });
    // Start a transition that interpolates the data based on year.
    chart.container.transition(t);
  }

  // Updates the display to show the specified year.
  function displayYear(year) {
    dots
      .data(interpolateData(year, data), key)
      .call(position)
      .sort(order);
    label.text(Math.round(year));
    $('#slider').slider('value', Math.round(year));
  }

  const handle = $('#custom-handle');
  $('#slider').slider({
    create() {
      handle.text($(this).slider('value'));
    },
    slide(event, ui) {
      handle.text(ui.value);
      window.pVals.currYear = ui.value;
      window.pVals.calRatio();
      stopPlaying();
      displayYear(ui.value);
    },
    min: 1800,
    max: 2009,
    change(event, ui) {
      handle.text(ui.value);
    },
    stop(event, ui) {
      console.log('stop event');
      // window.pVals.currYear = ui.value;
      // window.pVals.calRatio();
    },
  });
  return chart;
}
