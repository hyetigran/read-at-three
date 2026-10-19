export type PackageColumnRule = Readonly<{
  table: string;
  role: "metadata" | "root" | "pending";
}>;
export type PackageColumn = PackageColumnRule & Readonly<{ column: string }>;

const columns = new Map<string, PackageColumn>();
export function declarePackageColumn(column: string, rule: PackageColumnRule) {
  if (
    !rule ||
    !/^[a-z_]+$/.test(rule.table) ||
    !/^[a-z_]+$/.test(column) ||
    !["metadata", "root", "pending"].includes(rule.role)
  )
    throw new Error("Package-bearing columns require explicit classification");
  const key = `${rule.table}.${column}`;
  const previous = columns.get(key);
  if (previous && previous.role !== rule.role)
    throw new Error("Historical package classifications disagree");
  columns.set(key, Object.freeze({ ...rule, column }));
}
export function classifiedPackageColumns(): readonly PackageColumn[] {
  return [...columns.values()].sort((a, b) =>
    `${a.table}.${a.column}`.localeCompare(`${b.table}.${b.column}`),
  );
}
