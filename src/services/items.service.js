const { ItemsRepo } = require('../repositories/items.repo');

async function list() {
  try {
    return await ItemsRepo.findAll({
      where: { active: true },
      limit: 20,
      offset: 0,
      order: 'published_at DESC',
    });
  } catch (err) {
    throw new Error(
      `Erreur lors de la récupération des items : ${err.message}`
    );
  }
}

async function getById(id) {
  try {
    const item = await ItemsRepo.findByPk(id);
    if (!item) throw new Error('Item non trouvé');
    return item;
  } catch (err) {
    throw new Error(
      `Erreur lors de la récupération de l'item : ${err.message}`
    );
  }
}

async function create(data) {
  try {
    if (!data.feed_uuid || !data.title || !data.link)
      throw new Error(
        'le titre, le lien et le feed_uuid sont requis pour créer un item.'
      );

    const [item, created] = await ItemsRepo.findOrCreate({
      where: { link: data.link },
      defaults: data,
    });

    if (!created) throw new Error('Un item avec ce lien existe déjà.');
    return item;
  } catch (err) {
    throw new Error(`Erreur lors de la création de l'item : ${err.message}`);
  }
}

async function update(id, data) {
  try {
    const item = await ItemsRepo.findByPk(id);
    if (!item) throw new Error('Item non trouvé');
    await ItemsRepo.update(data, { where: { uuid: id } });
    return ItemsRepo.findByPk(id);
  } catch (err) {
    throw new Error(`Erreur lors de la mise à jour de l'item : ${err.message}`);
  }
}

async function remove(id) {
  try {
    const item = await ItemsRepo.findByPk(id);
    if (!item) throw new Error('Item non trouvé');
    const result = await ItemsRepo.destroy({ where: { uuid: id } });
    return result;
  } catch (err) {
    throw new Error(`Erreur lors de la suppression de l'item : ${err.message}`);
  }
}
module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
