import { getApiBase, authenticatedFetch, api } from '../utils/api';
export async function getHouseGroups(params) {
    const { page, limit } = params;
    const base = getApiBase();
    try {
        const res = await authenticatedFetch(`${base}/house-groups?page=${page}&limit=${limit}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            return { groups: data, total: data.length };
        }
        return {
            groups: data.groups ?? data.items ?? [],
            total: data.total ?? (data.groups?.length ?? data.items?.length ?? 0),
        };
    }
    catch {
        const mock = await api.getHouseGroups();
        return { groups: mock, total: mock.length };
    }
}
