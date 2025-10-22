const { db } = require('../config/db');

/**
 *! Fonction pour détecter automatiquement la clé primaire d'une table
 * @param {string} tableName - Nom de la table
 * @returns {Promise<string>} - Nom de la clé primaire
 */
async function getPrimaryKey(tableName) {
  const [columns] = await db.query(`DESCRIBE ${tableName}`);
  const pkColumn = columns.find((col) => col.Key === 'PRI');
  return pkColumn ? pkColumn.Field : 'id';
}

/**
 *! Crée un repository générique pour une table donnée
 * @param {string} tableName - Nom de la table
 * @param {object} opts - Options de configuration
 *   @param {boolean} timestamps - Si true, gère created_at / updated_at
 *   @param {boolean} paranoid - Si true, gère deleted_at (soft delete)
 *   @param {string} pk - Nom de la clé primaire (défaut 'id')
 *   @param {boolean} autoUuid - Si true, génère un UUID pour la clé primaire
 * @returns {object} - Objet repository avec méthodes CRUD
 */
async function createRepository(
  tableName,
  { timestamps = true, paranoid = false, pk = 'id', autoUuid = false } = {}
) {
  if (!tableName) throw new Error('Table name required');

  const nowSql = 'UTC_TIMESTAMP()'; // SQL pour l'heure actuelle en UTC

  //! Détection automatique de la clé primaire
  pk == pk || (await getPrimaryKey(tableName));

  /**
   *
   *! Générateur de clause WHERE SQL AUTO
   *
   * @param {object} where - Objet de conditions (clé → valeur)
   * @returns {object} - Objet avec SQL et paramètres
   */
  function buildWhere(where = {}) {
    const keys = Object.keys(where);
    if (!keys.length) return { sql: '', params: [] };

    const conditions = keys.map((k) => `${k}=?`).join('AND');
    const params = Object.values(where);
    return { sql: `WHERE ${conditions}`, params };
  }

  /**
   *
   *! Ajoute la condition de suppression logique (paranoid) à une clause WHERE SQL
   *
   * @param {string} whereClauseSql - Clause WHERE SQL existante
   * @returns {string} - Clause WHERE SQL modifiée avec condition paranoid
   */
  function addParanoid(whereClauseSql) {
    if (!paranoid) return whereClauseSql;
    const hasWhere = /\bWHERE\b/i.test(whereClauseSql);
    return hasWhere
      ? `${whereClauseSql} AND deleted_at IS NULL`
      : `${whereClauseSql} WHERE deleted_at IS NULL`;
  }

  return {
    /**
     *! Récupère plusieurs enregistrements de la table.
     *! Permet de filtrer, trier et paginer les résultats.
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
    /**
     *! Récupère un seul enregistrement de la table.
     *! Permet de filtrer les résultats via une clause WHERE.
     *
     * @async
     * @function findOne
     * @param {object} [options={}] - Options de requête.
     * @param {object} [options.where={}] - Filtres à appliquer sur les colonnes (clé → valeur).
     *  Exemple : `{ id: 123, active: true }` donnera `WHERE id = ? AND active = ?`.
     * @returns {Promise<object|null>} - Enregistrement trouvé ou null si aucun.
     *
     * @example
     * Récupérer un utilisateur par son ID
     * const user = await usersRepo.findOne({ where: { id: 42 } });
     *
     * @example
     * Récupérer un article actif par son slug
     * const article = await articlesRepo.findOne({ where: { slug: 'mon-article', active: true } });
     *
     */
    async findOne({ where = {} } = {}) {
      const { sql, params } = buildWhere(where);
      const withParanoid = addParanoid(sql);
      const query = `SELECT * FROM ${tableName} ${withParanoid} LIMIT 1`;
      const [rows] = await db.query(query, params);
      return rows[0] || null;
    },
    /**
     *
     *! Récupère un enregistrement par sa clé primaire
     *
     * @async
     * @function findByPk
     * @param {any} pkValue - Valeur de la clé primaire
     * @returns {Promise<object|null>} - Enregistrement trouvé ou null si aucun
     */
    async findByPk(pkValue) {
      const base = `WHERE ${pk}=?`;
      const withParanoid = addParanoid(base);
      const query = `SELECT * FROM ${tableName} ${withParanoid} LIMIT 1`;

      const [rows] = await db.query(query, [pkValue]);
      return rows[0] || null;
    },
  };
}
