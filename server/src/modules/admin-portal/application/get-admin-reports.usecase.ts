import type { AdminReportRange, AdminReportsRepository } from "../domain/admin-reports.repository.js";
export class GetAdminReportsUseCase {
  constructor(private readonly repository: AdminReportsRepository) {}
  execute(range: AdminReportRange) { return this.repository.load(range); }
  async export(range: AdminReportRange, actorId: string) {
    const data = await this.repository.load(range);
    const rows: Array<[string, string, string | number]> = [["range", "from UTC", data.range.from], ["range", "to UTC", data.range.to]];
    for (const [key, value] of Object.entries(data.snapshot)) rows.push(["snapshot", key, value]);
    for (const [key, value] of Object.entries(data)) {
      if (!Array.isArray(value)) continue;
      for (const row of value) {
        const { count, ...dimensions } = row as { count: number } & Record<string, string | number>;
        rows.push([key, Object.values(dimensions).join(" / "), count]);
      }
    }
    const escape = (value: string | number) => {
      let text = String(value);
      if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const csv = [["section", "dimension", "count"], ...rows].map(row => row.map(escape).join(",")).join("\r\n") + "\r\n";
    await this.repository.recordExport(actorId, range);
    return csv;
  }
}
