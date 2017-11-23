const path = require('path');
const webpack = require('webpack');

module.exports = [
	{
		// name: 'client',
		entry: {
			app: ['./src/main.js'], // This is the main file that gets loaded first; the "bootstrap", if you will.
		},

		output: {
			// Transpiled and bundled output gets put in `build/bundle.js`.
			path: path.resolve(__dirname, 'build'),
			publicPath: '/assets/', // But it gets served as "assets" for testing purposes.
			filename: 'bundle.js', // Really, you want to upload index.html and assets/bundle.js
		},

		// This makes it easier to debug scripts by listing line number of whichever file
		// threw the exception or console.log or whathaveyounot.
		devtool: 'inline-source-map',
		// devtool: 'cheap-module-eval-source-map',
		// devtool: 'eval-source-map',

		module: {
			rules: [
				// {
				//   test: /\.js$/,
				//   loader: 'eslint-loader',
				//   exclude: /node_modules/,
				// },
				{
					test: /\.ts?$/, // Another convention is to use the .es6 filetype, but you then
					// have to supply that explicitly in import statements, which isn't cool.
					exclude: [/(node_modules|bower_components)/],
					loader: 'ts-loader',
					// loaders: ['babel-loader', 'ts-loader'],
				},
				{
					test: /\.js?$/, // Another convention is to use the .es6 filetype, but you then
					// have to supply that explicitly in import statements, which isn't cool.
					exclude: /(node_modules|bower_components)/,
					loader: 'babel-loader',
				},
				// This nifty bit of magic right here allows us to load entire JSON files
				// synchronously using `require`, just like in NodeJS.
				{
					test: /\.json$/,
					loader: 'json-loader',
				},
				// This allows you to `require` CSS files.
				// We be in JavaScript land here, baby! No <style> tags for us!
				{
					test: /\.css$/,
					loader: 'style-loader!css-loader',
				},
			],
		},
		plugins: [
			new webpack.ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
				'window.jQuery': 'jquery',
				'window.$': 'jquery',
			}),
		],
		resolve: {
			alias: {
				modules: path.join(__dirname, 'node_modules'),
				'jquery-ui': 'jquery-ui-dist/jquery-ui.js',
				// 'jquery-ui-css$': 'jquery-ui-dist/jquery-ui.css',
				// bind to modules;
			},
		},
	},
];
