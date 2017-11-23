import * as d3 from 'd3';
import $ from 'jquery';
import $ui from 'jquery-ui';
import motionChart from './motion';

// import '../styles/jquery-ui.css';
import '../styles/style.css';

// const chart = chartFactory();

// Load the data.
async function fetchData() {
	const getData = async url => {
		try {
			const response = await fetch('../data/nations.json');
			const nations = await response.json();
			return nations;
		} catch (e) {
			console.error(e);
			return undefined;
		}
	};
	const data = await getData();
	return data;
}

const interpolateData = (nations, year = 1800) => {
	// A bisector since many nation's data is sparsely-defined.
	const bisect = d3.bisector(d => d[0]);

	// Finds (and possibly interpolates) the value for the specified year.
	function interpolateValues(values, year) {
		const i = bisect.left(values, year, 0, values.length - 1);
		const a = values[i];
		if (i > 0) {
			const b = values[i - 1];
			const t = (year - a[0]) / (b[0] - a[0]);
			return a[1] * (1 - t) + b[1] * t;
		}
		return a[1];
	}
	return nations.map(d => ({
		name: d.name,
		region: d.region,
		income: interpolateValues(d.income, year),
		population: interpolateValues(d.population, year),
		lifeExpectancy: interpolateValues(d.lifeExpectancy, year),
	}));
};
// getData().then(data => {
// 	console.log(data);
// });

// const newData = fetchData();
// console.log(newData);
fetchData()
	// .then(data => interpolateData(data))
	.then(data => motionChart(data));
// console.log(newData);