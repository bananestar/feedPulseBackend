const express = require('express');
const router = express.Router();
const feedsController = require('../controllers/feeds.controller');

//? Liste des feeds
router.get('/', feedsController.listFeeds);

//? Ajouter un feed
router.post('/', feedsController.createFeed);

//? Modifier un feed
router.patch('/:id', feedsController.updateFeed);

//? Supprimer un feed
router.delete('/:id', feedsController.deleteFeed);

module.exports = router;
