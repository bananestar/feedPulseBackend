const express = require('express');
const router = express.Router();
const feedsController = require('../controllers/feeds.controller');
const {
  parsePagination,
  validateUuidParam,
} = require('../middlewares/validate');

const asyncHandler = require('../utils/async-handler');

//? Liste des feeds
router.get('/', parsePagination, asyncHandler(feedsController.listFeeds));

//? Détail d’un feed
router.get(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(feedsController.getFeed)
);

//? Ajouter un feed
router.post('/', asyncHandler(feedsController.createFeed));

//? Modifier un feed
router.patch(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(feedsController.updateFeed)
);

//? Supprimer un feed
router.delete(
  '/:id',
  validateUuidParam('id'),
  asyncHandler(feedsController.deleteFeed)
);

module.exports = router;
