export interface PublicBusinessCategory {
  id: string;
  name: string;
}

export interface PublicBusiness {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  categories: PublicBusinessCategory[];
}

export interface PublicBusinessDetails extends PublicBusiness {
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
}

export interface PublicBusinessCategoryCount extends PublicBusinessCategory {
  count: number;
}

export interface PublicBusinessList {
  items: PublicBusiness[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class PublicBusinessNotFoundError extends Error {
  constructor() { super("Business not found."); this.name = "PublicBusinessNotFoundError"; }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";
const isNullableText = (value: unknown) => value === null || typeof value === "string";
const isCategory = (value: unknown): value is PublicBusinessCategory => isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
const isBusiness = (value: unknown): value is PublicBusiness => isRecord(value) && typeof value.id === "string" && typeof value.slug === "string" && typeof value.name === "string" && isNullableText(value.description) && isNullableText(value.address) && Array.isArray(value.categories) && value.categories.every(isCategory);

async function readPublicData(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(body) || !("data" in body)) throw new Error("Public businesses are temporarily unavailable.");
  return body.data;
}

export const publicBusinessesService = {
  async getBusinesses(query: { q?: string; categoryId?: string; page?: number }, signal?: AbortSignal): Promise<PublicBusinessList> {
    const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: "12" });
    if (query.q?.trim()) params.set("q", query.q.trim());
    if (query.categoryId) params.set("categoryId", query.categoryId);
    const response = await fetch(`${API_URL}/api/public/businesses?${params}`, { method: "GET", cache: "no-store", signal });
    const data = await readPublicData(response);
    if (!isRecord(data) || !Array.isArray(data.items) || !data.items.every(isBusiness) || !Number.isInteger(data.total) || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize) || !Number.isInteger(data.totalPages)) throw new Error("Public business response is invalid.");
    return data as unknown as PublicBusinessList;
  },

  async getCategories(signal?: AbortSignal): Promise<PublicBusinessCategoryCount[]> {
    const response = await fetch(`${API_URL}/api/public/business-categories`, { method: "GET", cache: "no-store", signal });
    const data = await readPublicData(response);
    if (!Array.isArray(data) || !data.every((item) => isCategory(item) && isRecord(item) && Number.isInteger(item.count))) throw new Error("Public business categories response is invalid.");
    return data as PublicBusinessCategoryCount[];
  },

  async getBusiness(slug: string, signal?: AbortSignal): Promise<PublicBusinessDetails> {
    const response = await fetch(`${API_URL}/api/public/businesses/${encodeURIComponent(slug)}`, { method: "GET", cache: "no-store", signal });
    if (response.status === 404) throw new PublicBusinessNotFoundError();
    const data = await readPublicData(response);
    if (!isBusiness(data) || !isRecord(data) || !isNullableText(data.websiteUrl) || !isNullableText(data.email) || !isNullableText(data.phone)) throw new Error("Public business details response is invalid.");
    return data as unknown as PublicBusinessDetails;
  },
};
