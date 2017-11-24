import motionChart from './motion';

// import '../styles/jquery-ui.css';
import '../styles/style.css';


// Load the data.

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

// const newData = fetchData();
// console.log(newData);

getData()
	// .then(data => interpolateData(data))
	.then(data => motionChart(data))
	.catch(e => console.log(e));
// console.log(newData);
