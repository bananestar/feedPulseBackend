const { Request, Response } = require('express');
const { ErrorResponse, NotFoundErrorResponse } = require('../utils/error-schema');
const { SuccessObjectResponse, SuccessArrayResponse } = require('../utils/response-schema');
const { feedService } = require('../services/feeds-service');

const feedController = {
	/**
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	listFeeds: async (req, res) => {},
	/**
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	createFeed: async (req, res) => {},
	/**
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	updateFeed: async (req, res) => {},
	/**
	 *
	 * @param {Request} req
	 * @param {Response} res
	 */
	deleteFeed: async (req, res) => {},
};

module.exports = feedController;
