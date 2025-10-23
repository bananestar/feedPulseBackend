const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
	parseTagValue: true,
	trimValues: true,
});

function normalizeEntry(raw) {
	const isAtom = !!raw.updated || !!raw.id;

	const guid = raw.guid?.['#text'] || raw.guid || raw.id || null;
	const link =
		(isAtom
			? Array.isArray(raw.link)
				? raw.link.find((l) => l.rel === 'alternate')?.href
				: raw.link?.href
			: raw.link) || null;
	const title = raw.title?.['#text'] || raw.title || '' || null;
	const description = raw.description || raw.summary || '' || null;
	const pubDate = raw.pubDate || raw.published || raw.updated || raw['dc:date'] || null;

	// Enclosure (torrent, fichier, etc.)
	const enclosure =
		raw.enclosure ||
		(isAtom
			? Array.isArray(raw.link)
				? raw.link.find((l) => l.rel === 'enclosure')
				: null
			: null);

	const enclosure_url = enclosure?.url || enclosure?.href || null;
	const enclosure_length = enclosure?.length ? Number(enclosure.length) : null;

	// Magnet / infohash (si présent)
	const magnet =
		(typeof link === 'string' && link.startsWith('magnet:') && link) ||
		(typeof enclosure_url === 'string' && enclosure_url.startsWith('magnet:') && enclosure_url) ||
		null;

	let infohash = null;
	if (magnet) {
		const m = magnet.match(/btih:([A-Za-z0-9]+)/i);
		if (m) infohash = m[1].toLowerCase();
	}

	return {
		guid,
		link: typeof link === 'string' ? link : null,
		title: typeof title === 'string' ? title : null,
		description: typeof description === 'string' ? description : null,
		pubDate: pubDate ? new Date(pubDate).toISOString() : null,
		enclosure_url: typeof enclosure_url === 'string' ? enclosure_url : null,
        enclosure_length,
        magnet,
        infohash,
	};
}

async function fetchRss(feed){
    
}
