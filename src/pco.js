export async function pcoFetch(url, auth, fetchFn = globalThis.fetch) {
  const res = await fetchFn(url, {
    headers: { Authorization: `Basic ${auth}`, "User-Agent": "EgliseApp/1.0" },
  });
  if (!res.ok) throw new Error(`PCO ${url}: ${res.status}`);
  return await res.json();
}

export async function pcoFetchAll(baseUrl, auth, params = {}, fetchFn = globalThis.fetch) {
  const allData = [];
  let offset = 0;
  const perPage = 100;
  while (true) {
    const sp = new URLSearchParams({
      per_page: String(perPage),
      ...params,
      offset: String(offset),
    });
    const json = await pcoFetch(`${baseUrl}?${sp.toString()}`, auth, fetchFn);
    const items = json.data || [];
    allData.push(...items);
    if (items.length < perPage) break;
    offset += perPage;
  }
  return allData;
}
