const express = require('express');
const router = express.Router();

const itemsController = require('../controllers/items.controller');
const { parsePagination, validateUuidParam } = require('../middlewares/validate');

const asyncHandler = require('../utils/async-handler');

//? Liste des items
router.get('/', parsePagination, asyncHandler(itemsController.listItems));

//? Détail d’un item
router.get('/:id', validateUuidParam('id'), asyncHandler(itemsController.getItem));

//? Ajouter un item
router.post('/', asyncHandler(itemsController.createItem));

//? Modifier un item
router.patch('/:id', validateUuidParam('id'), asyncHandler(itemsController.updateItem));

//? Supprimer un item
router.delete('/:id', validateUuidParam('id'), asyncHandler(itemsController.deleteItem));

module.exports = router;
