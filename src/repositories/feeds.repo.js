const { createRepository } = require('../database/repository');

const schema = {
  uuid: { type: 'string', primary: true },
  title: { type: 'string', required: true },
  url: { type: 'string', required: true },
  site_name: { type: 'string', default: null },
  description: { type: 'string', default: null },
  language: { type: 'string', default: 'fr' },
  active: { type: 'boolean', default: true },
  created_at: { type: 'datetime', default: () => new Date() },
  updated_at: { type: 'datetime', default: () => new Date() },
  deleted_at: { type: 'datetime', default: null },
};

/**
 *! Repository des flux RSS/Atom
 *
 * @param {Object} options - Options du repository
 * @param {boolean} options.timestamps - Active la gestion automatique des timestamps
 * @param {boolean} options.paranoid - Active la suppression douce (soft delete)
 * @param {string} options.pk - Clé primaire de la table
 * @param {boolean} options.autoUuid - Génère automatiquement un UUID pour la clé primaire
 * @param {Object} options.schema - Schéma des champs de la table
 * @param {Object} options.defaults - Valeurs par défaut pour les nouveaux enregistrements
 * @returns {Object} Repository des flux
 */
const feedsRepo = createRepository('feeds', {
  timestamps: true,
  paranoid: true,
  pk: 'uuid',
  autoUuid: true,
  schema,
  defaults: {
    active: true,
    language: 'fr',
  },
});

module.exports = { feedsRepo };
