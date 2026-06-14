import * as XLSX from "xlsx";

type SheetData = {
  name: string;
  data: Record<string, unknown>[];
};

/**
 * Export data to an Excel (.xlsx) file and trigger a download.
 * Supports multiple sheets in a single workbook.
 */
export function exportToExcel(
  sheets: SheetData[],
  filename: string = "export"
) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(sheet.data);

    // Auto-size columns based on content
    const colWidths = Object.keys(sheet.data[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...sheet.data.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // Sheet name max 31 chars
  }

  // Generate file and trigger download
  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}

/**
 * Format a date string for Excel export
 */
export function formatDateForExport(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a percentage for export
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}
