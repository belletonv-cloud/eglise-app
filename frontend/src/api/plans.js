import { getApiBase, authenticatedFetch, api } from '../utils/api';
export async function getPlans(params) {
    const { page, limit } = params;
    const base = getApiBase();
    try {
        const res = await authenticatedFetch(`${base}/plans?page=${page}&limit=${limit}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            return { plans: data, total: data.length };
        }
        return {
            plans: data.plans ?? data.items ?? [],
            total: data.total ?? (data.plans?.length ?? data.items?.length ?? 0),
        };
    }
    catch {
        const mock = await api.getPlans();
        return { plans: mock, total: mock.length };
    }
}
