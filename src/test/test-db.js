const { db } = require('../config/db');

(async () => {
	const [rows] = await db.query('SELECT NOW() as now');
	console.log('✅ Connexion OK - Heure serveur :', rows[0].now);
	process.exit(0);
})();
