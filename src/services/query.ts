export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function search(q: string | undefined, fields: string[]) {
  return q
    ? { $or: fields.map((field) => ({ [field]: { $regex: escapeRegex(q), $options: "i" } })) }
    : {};
}

export function dateRange(from?: string, to?: string) {
  return {
    ...(from ? { $gte: new Date(from) } : {}),
    ...(to ? { $lte: new Date(/^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to}T23:59:59.999Z` : to) } : {}),
  };
}

export function meta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
