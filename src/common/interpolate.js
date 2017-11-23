import * as d3 from 'd3';

export default (year = 1800, data) => {
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
	return data.map(d => ({
		name: d.name,
		region: d.region,
		income: interpolateValues(d.income, year),
		population: interpolateValues(d.population, year),
		lifeExpectancy: interpolateValues(d.lifeExpectancy, year),
	}));
};
