import * as d3 from 'd3';
import $ from 'jquery';
import $ui from 'jquery-ui';
import chartFactory from './common';
import interpolateData from './common/interpolate';

window.d3 = d3;

export default function motionChart(data) {
	const chart = chartFactory();
	const width = chart.width - chart.margin.right - 500;
	const height = chart.height - chart.margin.bottom - 400;

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
			.attr('r', d => radiusScale(radius(d)));
	}

	// Defines a sort order so that the smallest dots are drawn on top.
	function order(a, b) {
		return radius(b) - radius(a);
	}
	// Various scales. These domains make assumptions of data, naturally.
	const xScale = d3
		.scaleLog()
		.domain([300, 1e5])
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
	const xAxis = d3.axisBottom(xScale).tickArguments(12, ',d');

	const yAxis = d3.axisLeft(yScale);

	// Add the x-axis.
	chart.svg
		.append('g')
		.attr('class', 'x axis')
		.attr('transform', `translate(0,${height})`)
		.call(xAxis);

	// Add the y-axis.
	chart.svg
		.append('g')
		.attr('class', 'y axis')
		.call(yAxis);

	// Add an x-axis label.
	chart.svg
		.append('text')
		.attr('class', 'x label')
		.attr('text-anchor', 'end')
		.attr('x', width)
		.attr('y', height - 6)
		.text('income per capita, inflation-adjusted (dollars)');

	// Add a y-axis label.
	chart.svg
		.append('text')
		.attr('class', 'y label')
		.attr('text-anchor', 'end')
		.attr('y', 6)
		.attr('dy', '.75em')
		.attr('transform', 'rotate(-90)')
		.text('life expectancy (years)');

	// Add the year label; the value is set on transition.
	const label = chart.svg
		.append('text')
		.attr('class', 'year label')
		.attr('text-anchor', 'end')
		.attr('y', height - 24)
		.attr('x', width)
		.text(1800);

	// Add a dot per nation. Initialize the data at 1800, and set the colors.
	const dots = chart.svg
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
		console.log('stopPlaying', window.pVals.currYear);
		// window.test = svg.transition('yeah').duration(0);

		chart.svg.interrupt('yeah');
	}
	window.pVals = {
		lastTween: 0,
		currTween: null,
		currYear: null,
		calRatio() {
			const allWidth = 2009 - 1800;
			const diff = this.currYear - 1800;
			this.lastTween = diff / allWidth;
			return diff / allWidth;
		},
	};
	const duration = 209000;
	function transition() {
		const t = chart.svg
			.transition('yeah')
			.duration(d => {
				if (duration - duration * window.pVals.lastTween === 0) {
					console.log('IT"S ZERO');
				}
				console.log(duration - duration * window.pVals.lastTween);
				return duration - duration * window.pVals.lastTween;
			})
			// .delay((d, i) => i * 5)
			.ease(d3.easeLinear)
			.tween('year', (d, i, e) => tweenYear());

		t
			.on('start', d => {
				// ?????????????
				// tweenYear()();
				console.log('Transition started', d);
			})
			.on('end', d => {
				console.log('Transition ended', d);
				// why do we need this method?
			})
			.on('interrupt', (d, i, el) => {
				// console.log(d, i, el);
				window.pVals.lastTween = window.pVals.currTween;
				console.log('Transition interrupted', d);
			});
		// Start a transition that interpolates the data based on year.
		chart.svg.transition(t);
	}

	// Tweens the entire chart by first tweening the year, and then the data.
	// For the interpolated data, the dots and label are redrawn.
	// d3doc: transition.tween - run custom code during the transition.
	function tweenYear() {
		const year = d3.interpolateNumber(window.pVals.currYear || 1800, 2009);
		return tween => {
			// console.log(t);
			tween += window.pVals.lastTween; // was it previously paused?
			window.pVals.currTween = tween;
			// console.log('tween', tween);
			window.pVals.currYear = Math.round(year(tween));
			// $('#slider').slider('value', window.pVals.currYear);
			displayYear(year(tween));
		};
	}
	// Updates the display to show the specified year.
	function displayYear(year) {
		// window.pVals.currYear = Math.round(year);
		dots
			.data(interpolateData(year, data), key)
			.call(position)
			.sort(order);
		label.text(Math.round(year));
		// console.log('current year', year);
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
			displayYear(ui.value, data);
		},
		min: 1800,
		max: 2009,
		change(event, ui) {
			handle.text(ui.value);
		},
	});
	return chart;
}
