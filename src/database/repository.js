const { db } = require('../config/db');

/**
 * Crée un repository générique pour une table donnée
 * @param {string} tableName
 * @param {object} opts
 *  - timestamps: boolean (def: true) => gère created_at/updated_at
 *  - paranoid: boolean (def: false) => gère deleted_at (soft delete)
 *  - pk: string (def: 'id') => nom de la PK
 *  - autoUuid: boolean (def: false) => si true, génère un UUID côté Node si pk manquante
 */
function createRepository(
	tableName,
	{ timestamps = true, paranoid = false, pk = 'id', autoUuid = false } = {}
) {
	if (!tableName) throw new Error('Table name required');

	const nowSql = 'UTC_TIMESTAMP()';

	//! Générateur de clause WHERE AUTO
	function buildWhere(where = {}) {
		const keys = Object.keys(where);
		if (!keys.length) return { sql: '', params: [] };
		const conditions = keys.map((k) => `${k}=?`).join('AND');
		const params = Object.values(where);
		return { sql: `WHERE ${conditions}`, params };
	}

	function addParanoid(whereClauseSql) {
		if (!paranoid) return whereClauseSql;
		const hasWhere = /\bWHERE\b/i.test(whereClauseSql);
		return hasWhere
			? `${whereClauseSql} AND deleted_at IS NULL`
			: `${whereClauseSql} WHERE deleted_at IS NULL`;
	}

	return {
		/**
		 * Récupère plusieurs enregistrements de la table.
		 *
		 * Permet de filtrer, trier et paginer les résultats.
		 *
		 * @async
		 * @function findAll
		 * @param {object} [options={}] - Options de requête.
		 * @param {object} [options.where={}] - Filtres à appliquer sur les colonnes (clé → valeur).
		 *    Exemple : `{ active: true, category: 'news' }` donnera `WHERE active = ? AND category = ?`.
		 * @param {number} [options.limit] - Nombre maximum de lignes à retourner.
		 * @param {number} [options.offset] - Nombre de lignes à ignorer avant de commencer à retourner les résultats.
		 * @param {string} [options.order] - Clause de tri SQL (`"column ASC"` ou `"column DESC"`).
		 * @returns {Promise<object[]>} - Tableau des enregistrements trouvés.
		 *
		 * @example
		 * Récupérer tous les flux actifs, triés par date descendante, limités à 20
		 * const feeds = await feedsRepo.findAll({
		 *   where: { active: true },
		 *   limit: 20,
		 *   order: 'created_at DESC'
		 * });
		 *
		 * @example
		 * Récupérer les 10 premiers éléments d'une catégorie
		 * const items = await itemsRepo.findAll({
		 *   where: { category: 'science' },
		 *   limit: 10
		 * });
		 */
		async findAll({ where = {}, limit, offset, order } = {}) {
			const { sql, params } = buildWhere(where);
			const withParanoid = addParanoid(sql);
			const query = `SELECT * FROM ${tableName} ${withParanoid} LIMIT 1`;
			const [rows] = await db.query(query, params);
			return rows[0] || null;
		},
	};
}
