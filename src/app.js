const express = require('express');
const feedsRoutes = require('./routes/feeds.routes');
const itemsRoutes = require('./routes/items.routes');
const healthRoutes = require('./routes/health.routes');
const { NotFoundErrorResponse, ErrorResponse } = require('./utils/error-schema');

function buildApp() {
	const app = express();
	app.disable('x-powered-by');

	//! --- Montage des routers ---
	app.use('/feeds', feedsRoutes);
	app.use('/items', itemsRoutes);
	app.use('/health', healthRoutes);

	//? 404
	app.use((req, res) => res.status(404).json(new NotFoundErrorResponse('Not Found')));

	//? Erreurs globales
	app.use((err, req, res, next) => {
		console.error('[API ERROR]', err);
		res.status(400).json(new ErrorResponse(err.message || 'Bad Request'));
	});

	return app;
}

module.exports = { buildApp };
