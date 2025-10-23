const { Request, Response } = require('express');
const itemsService = require('../services/items.service');
const { SuccessObjectResponse, SuccessArrayResponse } = require('../utils/response-schema');
const { ErrorResponse, NotFoundErrorResponse } = require('../utils/error-schema');

const itemsController = {
	/**
	 *
	 *! List les items
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	listItems: async (req, res) => {
		try {
			const items = await itemsService.list();
			res.status(200).json(new SuccessArrayResponse(items));
		} catch (err) {
			res.status(400).json(new ErrorResponse(err.message));
		}
	},
	/**
	 *
	 *! Récupère le détail d’un item
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	getItem: async (req, res) => {
		try {
			const item = await itemsService.getById(req.params.id);
			res.status(200).json(new SuccessObjectResponse(item));
		} catch (err) {
			const status = /non trouvé/i.test(err.message) ? 404 : 400;
			const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
			res.status(status).json(new Res(err.message));
		}
	},
	/**
	 *
	 *! Crée un nouveau item
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	createItem: async (req, res) => {
		try {
			const item = await itemsService.create(req.body);
			res.status(201).set('Location', `/items/${item.uuid}`).json(new SuccessObjectResponse(item));
		} catch (err) {
			res.status(400).json(new ErrorResponse(err.message));
		}
	},
	/**
	 *! Met à jour un item existant
	 * @param {Request} req
	 * @param {Response} res
	 */
	updateItem: async (req, res) => {
		try {
			const item = await itemsService.update(req.params.id, req.body);
			return res.status(200).json(new SuccessObjectResponse(item));
		} catch (err) {
			const status = /non trouvé/i.test(err.message) ? 404 : 400;
			const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
			return res.status(status).json(new Res(err.message));
		}
	},
	/**
	 *! Supprime un item
	 * @param {Request} req
	 * @param {Response} res
	 */
	deleteItem: async (req, res) => {
		try {
			await itemsService.remove(req.params.id);
			return res.status(200).json(new SuccessObjectResponse({ message: 'Item supprimé' }));
		} catch (err) {
			const status = /non trouvé/i.test(err.message) ? 404 : 400;
			const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
			return res.status(status).json(new Res(err.message));
		}
	},
};

module.exports = itemsController;
