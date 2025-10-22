const { feedsRepo } = require('../repositories/feeds.repo');

async function list() {
  try {
    const feeds = await feedsRepo.findAll({
      where: { active: true },
      limit: 10,
      offset: 0,
      order: 'created_at DESC',
    });
    return feeds;
  } catch (err) {
    throw new Error(`Erreur lors de la récupération des flux : ${err.message}`);
  }
}

async function getById(id) {
  try {
    const feed = await feedsRepo.findByPk(id);
    if (!feed) throw new Error('Flux non trouvé');
    return feed;
  } catch (err) {
    throw new Error(`Erreur lors de la récupération du flux : ${err.message}`);
  }
}

async function create(data) {
  try {
    if (!data.title || !data.url)
      throw new Error("Le titre et l'URL sont requis pour créer un flux.");

    const [feed, created] = await feedsRepo.findOrCreate({
      where: { url: data.url },
      defaults: data,
    });

    if (!created) throw new Error('Un flux avec cette URL existe déjà.');
    return feed;
  } catch (err) {
    throw new Error(`Erreur lors de la création du flux : ${err.message}`);
  }
}

async function update(id, data) {
  try {
    const feed = await feedsRepo.findByPk(id);
    if (!feed) throw new Error('Flux non trouvé');
    const updatedFeed = await feedsRepo.update(data, { where: { id } });
    return updatedFeed;
  } catch (err) {
    throw new Error(`Erreur lors de la mise à jour du flux : ${err.message}`);
  }
}

async function remove(id) {
  try {
    const feed = await feedsRepo.findByPk(id);
    if (!feed) throw new Error('Flux non trouvé');
    const result = await feedsRepo.destroy({ where: { id } });
    return result;
  } catch (err) {
    throw new Error(`Erreur lors de la suppression du flux : ${err.message}`);
  }
}
