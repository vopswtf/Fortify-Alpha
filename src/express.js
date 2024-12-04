
const fs = require('fs');
const path = require('path');
const express = require('express');

module.exports = (app) => {
    // log every request
    app.use((req, res, next) => {
        console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);

		res._json = res.json;
		res.json = function(obj) {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.write(JSON.stringify(obj));
			res.end();
		};

        next();
    });

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	fs.readdirSync(path.join(__dirname, 'routes')).forEach((route) => {
		if (!route.endsWith('.js')) return;
		
		try {
			require(path.join(__dirname, 'routes', route))(app);
		} catch (error) {
			console.error(`Error loading route ${route}: ${error}`);
		}
	});

	app.all('*', (req, res) => {
		res.status(404).json({ error: 'Not Found' });
		console.log(`[${new Date().toLocaleString()}] \x1b[31m${req.method} ${req.url} Not Found\x1b[0m`);
	});
};