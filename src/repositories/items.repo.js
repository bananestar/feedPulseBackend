const { createRepository } = require('../database/repository');

const schema = {
  uuid: { type: 'string', primary: true },
  feed_uuid: { type: 'string', required: true },
  title: { type: 'string', required: true },
  link: { type: 'string', required: true },
  description: { type: 'string' },
  published_at: { type: 'datetime' },
  created_at: { type: 'datetime' },
  updated_at: { type: 'datetime' },
  deleted_at: { type: 'datetime' },
};

const ItemsRepo = createRepository('items', {
  timestamps: true,
  paranoid: true,
  pk: 'uuid',
  autoUuid: true,
  schema,
});

module.exports = { ItemsRepo };
