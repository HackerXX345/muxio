// Proxies TMDB read API so the bearer key stays server-side (set TMDB_API_KEY
// in the Netlify site environment). Adds a short edge cache for catalog calls.
exports.handler = async (event) => {
    const key = process.env.TMDB_API_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'TMDB_API_KEY not configured' }) };
    const params = new URLSearchParams(event.queryStringParameters || {});
    const path = params.get('path') || '/trending/all/week';
    if (!path.startsWith('/')) return { statusCode: 400, body: JSON.stringify({ error: 'bad path' }) };
    params.delete('path');
    const url = `https://api.themoviedb.org/3${path}?${params.toString()}`;
    try {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
        const body = await r.text();
        return {
            statusCode: r.status,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
            body
        };
    } catch (e) {
        return { statusCode: 502, body: JSON.stringify({ error: 'upstream failed' }) };
    }
};
