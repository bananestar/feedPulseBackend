const { Request, Response } = require('express');
const {
  ErrorResponse,
  NotFoundErrorResponse,
} = require('../utils/error-schema');
const {
  SuccessObjectResponse,
  SuccessArrayResponse,
} = require('../utils/response-schema');
const feedsService = require('../services/feeds.service');

const feedController = {
  /**
   *
   *! Liste les flux
   *
   * @param {Request} req
   * @param {Response} res
   */
  listFeeds: async (req, res) => {
    try {
      const feeds = await feedsService.list();
      return res.status(200).json(new SuccessArrayResponse(feeds));
    } catch (err) {
      return res.status(400).json(new ErrorResponse(err.message));
    }
  },
  /**
   *! Crée un nouveau flux
   * @param {Request} req
   * @param {Response} res
   */
  createFeed: async (req, res) => {
    try {
      const feed = await feedsService.create(req.body);
      return res.status(201).json(new SuccessObjectResponse(feed));
    } catch (err) {
      const status = /existe déja/i.test(err.message) ? 409 : 400;
      return res.status(status).json(new ErrorResponse(err.message));
    }
  },
  /**
   *! Met à jour un flux existant
   * @param {Request} req
   * @param {Response} res
   */
  updateFeed: async (req, res) => {
    try {
      const { id } = req.params;
      const feed = await feedsService.update(id, req.body);
      return res.status(200).json(new SuccessObjectResponse(feed));
    } catch (err) {
      const status = /non trouvé/i.test(err.message) ? 404 : 400;
      const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
      return res.status(status).json(new Res(err.message));
    }
  },
  /**
   *! Supprime un flux
   * @param {Request} req
   * @param {Response} res
   */
  deleteFeed: async (req, res) => {
    try {
      const { id } = req.params;
      await feedsService.remove(id);
      return res
        .status(200)
        .json(new SuccessObjectResponse({ message: 'Flux supprimé' }));
    } catch (err) {
      const status = /non trouvé/i.test(err.message) ? 404 : 400;
      const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
      return res.status(status).json(new Res(err.message));
    }
  },
  /**
   *! Récupère le détail d’un flux
   * @param {Request} req
   * @param {Response} res
   */
  getFeed: async (req, res) => {
    try {
      const feed = await feedsService.getById(req.params.id);
      return res.status(200).json(new SuccessObjectResponse(feed));
    } catch (err) {
      const status = /non trouvé/i.test(err.message) ? 404 : 400;
      const Res = status === 404 ? NotFoundErrorResponse : ErrorResponse;
      return res.status(status).json(new Res(err.message));
    }
  },
};

module.exports = feedController;
