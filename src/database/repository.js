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
     * TODO : Récupérer tous les flux actifs, triés par date descendante, limités à 20
     * const feeds = await feedsRepo.findAll({
     *   where: { active: true },
     *   limit: 20,
     *   order: 'created_at DESC'
     * });
     *
     * @example
     * TODO : Récupérer les 10 premiers éléments d'une catégorie
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
     *! Récupère plusieurs enregistrements de la table avec le total.
     *! Permet de filtrer, trier et paginer les résultats.
     *
     * @async
     * @function findAndCountAll
     * @param {object} [options={}] - Options de requête.
     * @param {object} [options.where={}] - Filtres à appliquer sur les colonnes (clé → valeur).
     *    Exemple : `{ active: true, category: 'news' }` donnera `WHERE active = ? AND category = ?`.
     * @param {number} [options.limit] - Nombre maximum de lignes à retourner.
     * @param {number} [options.offset] - Nombre de lignes à ignorer avant de commencer à retourner les résultats.
     * @param {string|Array} [options.order] - Clause de tri SQL (`"column ASC"` ou `"column DESC"`). Peut être une chaîne ou un tableau de chaînes.
     * @returns {Promise<{ rows: object[], count: number }>} - Objet avec tableau des enregistrements trouvés et total.
     *
     * @example
     * TODO : Récupérer tous les flux actifs, triés par date descendante, limités à 20
     * const feeds = await feedsRepo.findAndCountAll({
     *   where: { active: true },
     *   limit: 20,
     *   offset: 0,
     *   order: ['created_at DESC', 'title ASC']
     * });
     *
     * @example
     * TODO : Récupérer les 10 premiers éléments d'une catégorie, triés par date et titre
     * const { count, rows } = await itemsRepo.findAndCountAll({
     *   where: { category: 'science' },
     *   limit: 10,
     *   offset: 0,
     *   order: ['created_at DESC', 'title ASC']
     * });
     */
    async findAndCountAll({ where = {}, limit, offset, order } = {}) {
      const { sql, params } = buildWhere(where);
      const withParanoid = addParanoid(sql);

      // Gestion du tri dynamique
      let orderClause = '';
      if (Array.isArray(order)) {
        // Si order est un tableau, on genère chaque condition de tri
        orderClause = order
          .map((o) => {
            // Validation du order
            const [column, direction] = o.split(' ').map((str) => str.trim());
            return `${column} ${direction === 'DESC' ? 'DESC' : 'ASC'}`;
          })
          .join(', ');
      } else if (typeof order === 'string') {
        orderClause = order;
      }

      // Requête pour récupérer les enregistrements
      const dataClauses = [];
      if (withParanoid) dataClauses.push(withParanoid);
      if (orderClause) dataClauses.push(`ORDER BY ${orderClause}`);
      dataClauses.push(`LIMIT ${limit || 100}`); // Limite par défaut à 100
      dataClauses.push(`OFFSET ${offset || 0}`);

      const dataQuery = `SELECT * FROM ${tableName} ${dataClauses.join(' ')}`;

      // Requête pour compter le total
      const countQuery = `SELECT COUNT(*) AS count FROM ${tableName} ${withParanoid}`;

      // Exécution des deux requêtes en parallèle
      const [data, countResult] = await Promise.all([
        db.query(dataQuery, params),
        db.query(countQuery, params),
      ]);

      // Retour des résultats
      return { count: countResult[0].count, rows: data };
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
     * TODO : Récupérer un utilisateur par son ID
     * const user = await usersRepo.findOne({ where: { id: 42 } });
     *
     * @example
     * TODO : Récupérer un article actif par son slug
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
    /**
     *! Crée un nouvel enregistrement dans la table
     *
     * @async
     * @function create
     * @param {object} data - Données de l'enregistrement à créer
     * @returns {Promise<object>} - Enregistrement créé
     *
     * @example
     * TODO : Créer un nouvel utilisateur
     * const newUser = await usersRepo.create({
     *   username: 'johndoe',
     *   email: 'johndoe@exemple.com',
     *   password: 'hashed_password',
     * });
     *
     */
    async create(data) {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');

      const sql = `INSERT INTO ${tableName} (${columns.join(
        ', '
      )}) VALUES (${placeholders})`;
      const [result] = await db.query(sql, Object.values(data));

      return this.findByPk(result.insertId || data[pk]);
    },
    /**
     *! Met à jour un ou plusieurs enregistrement existant dans la table
     *
     * @async
     * @function update
     * @param {object} data - Données à mettre à jour (clé → valeur)
     * @param {object} where - Conditions pour sélectionner les enregistrements à mettre à jour (clé → valeur)
     * @returns {Promise<number>} - Nombre d'enregistrements mis à jour
     *
     * @example
     * TODO : Mettre à jour le statut actif de plusieurs utilisateurs
     * const updatedCount = await usersRepo.update(
     *   { active: false },
     *   { where: { last_login: null } }
     * );
     *
     */
    async update(data, { where }) {
      const setKeys = Object.keys(data);
      const setSql = setKeys.map((k) => `${k}=?`).join(', ');
      const setParams = setKeys.map((k) => data[k]);

      const { sql: whereSql, params: whereParams } = buildWhere(where);
      const withParanoid = addParanoid(whereSql);

      const query = `UPDATE ${tableName} SET ${setSql} ${withParanoid}`;
      const [result] = await db.query(query, [...setParams, ...whereParams]);
      return result.affectedRows;
    },
    /**
     *! Supprime un ou plusieurs enregistrements de la table
     *
     * @async
     * @function destroy
     * @param {object} where - Conditions pour sélectionner les enregistrements à supprimer (clé → valeur)
     * @returns {Promise<number>} - Nombre d'enregistrements supprimés
     *
     * @example
     * TODO : Supprimer tous les articles d'une catégorie spécifique
     * const deletedCount = await articlesRepo.destroy({
     *   where: { category: 'obsolete' }
     * });
     */
    async destroy({ where }) {
      const { sql: whereSql, params: whereParams } = buildWhere(where);
      const withParanoid = addParanoid(whereSql);
      const query = `DELETE FROM ${tableName} ${withParanoid}`;
      const [result] = await db.query(query, whereParams);
      return result.affectedRows;
    },
    /**
     *! Trouve un enregistrement par ses conditions ou le crée s'il n'existe pas
     * @async
     * @function findOrCreate
     * @param {object} options - Options pour la recherche ou la création
     * @param {object} options.where - Conditions pour trouver l'enregistrement
     * @param {object} options.defaults - Données par défaut pour créer l'enregistrement s'il n'existe pas
     * @returns {Promise<[object, boolean]>} - Tableau contenant l'enregistrement trouvé ou créé et un booléen indiquant s'il a été créé
     * @example
     * TODO : Trouver ou créer un utilisateur par son email
     * const [user, created] = await usersRepo.findOrCreate({
     * where: { email: 'joeDoe@exemple.com' },
     * defaults: { username: 'joeDoe', password: 'hashed_password' }
     * });
     */
    async findOrCreate({ where = {}, defaults = {} } = {}) {
      const found = await this.findOne({ where });
      if (found) return [found, false];

      const data = { ...where, ...defaults };
      const created = await this.create(data);
      return [created, true];
    },
  };
}
