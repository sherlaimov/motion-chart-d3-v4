import * as d3 from 'd3';

const protoChart = {
	width: 860,
	height: 540,
	margin: {
		left: 30,
		right: 0,
		top: 10,
		bottom: 40,
	},
};

export default function chartFactory(opts, proto = protoChart) {
	const chart = Object.assign({}, proto, opts);

	chart.svg = d3
		.select('#chart')
		.append('svg')
		.attr('id', chart.id || 'chart')
		.attr('width', chart.width + chart.margin.left + chart.margin.right)
		.attr('height', chart.height + chart.margin.bottom + chart.margin.top);

	chart.container = chart.svg
		.append('g')
		.attr('id', 'container')
		.attr('transform', `translate(${chart.margin.left}, ${chart.margin.top})`);

	return chart;
}
