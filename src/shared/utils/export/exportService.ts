import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from 'docx';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { applyPlugin } from 'jspdf-autotable';

/**
 * Column definition for the export service
 */
export interface ExportColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: any) => string | number;
}

/**
 * Configuration options for exports
 */
export interface ExportOptions {
  fileName?: string;
  title?: string;
  sheetName?: string;
  author?: string;
  excludeColumns?: string[];
}

/**
 * Service to handle data exports to various formats
 */
export class ExportService {
  /**
   * Export data to Excel format
   */
  public static async exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    options?: ExportOptions
  ): Promise<void> {
    const {
      fileName = 'export',
      title = 'Data Export',
      sheetName = 'Sheet 1',
      author = 'OrderBookerTargetTracker',
      excludeColumns = [],
    } = options || {};

    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = author;
      workbook.created = new Date();

      // Add a worksheet
      const worksheet = workbook.addWorksheet(sheetName);

      // Filter columns based on exclusion list
      const filteredColumns = columns.filter((col) => !excludeColumns.includes(col.dataIndex));

      // Set headers
      worksheet.addRow([title]);
      worksheet.mergeCells(1, 1, 1, filteredColumns.length);
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add column headers
      const headers = filteredColumns.map((col) => col.title);
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };

      // Style the header row
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Add data rows
      data.forEach((item) => {
        const rowData = filteredColumns.map((col) => {
          if (col.render) {
            return col.render(item[col.dataIndex], item);
          }
          return item[col.dataIndex];
        });

        worksheet.addRow(rowData);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        const columnWidth = filteredColumns[index]?.width || 15;
        column.width = columnWidth;
      });

      // Generate file path using Tauri dialog
      const filePath = await save({
        filters: [
          {
            name: 'Excel Files',
            extensions: ['xlsx'],
          },
        ],
        defaultPath: `${fileName}.xlsx`,
      });

      if (filePath) {
        // Generate buffer and save to file
        const buffer = await workbook.xlsx.writeBuffer();
        await writeFile(filePath, new Uint8Array(buffer));
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export data to PDF format
   */
  public static async exportToPdf<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    options?: ExportOptions
  ): Promise<void> {
    const { fileName = 'export', title = 'Data Export', excludeColumns = [] } = options || {};
    applyPlugin(jsPDF);

    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Filter columns
      const filteredColumns = columns.filter((col) => !excludeColumns.includes(col.dataIndex));

      // Add title
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 10, { align: 'center' });
      doc.setFontSize(10);

      // Table configuration
      const startY = 20;
      const tableData: any[] = [];

      // Add headers
      const headers = filteredColumns.map((col) => col.title);
      tableData.push(headers);

      // Add data rows
      data.forEach((item) => {
        const rowData = filteredColumns.map((col) => {
          if (col.render) {
            return col.render(item[col.dataIndex], item);
          }
          return item[col.dataIndex] !== undefined ? String(item[col.dataIndex]) : '';
        });
        tableData.push(rowData);
      });

      // Add the table
      (doc as any).autoTable({
        startY,
        head: [headers],
        body: tableData.slice(1),
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'auto',
        },
        columnStyles: filteredColumns.reduce(
          (acc, col, index) => {
            if (col.width) {
              acc[index] = { cellWidth: col.width };
            }
            return acc;
          },
          {} as Record<number, any>
        ),
      });

      // Generate file path using Tauri dialog
      const filePath = await save({
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf'],
          },
        ],
        defaultPath: `${fileName}.pdf`,
      });

      if (filePath) {
        // Save the PDF
        const buffer = doc.output('arraybuffer');
        await writeFile(filePath, new Uint8Array(buffer));
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Export data to Word document format using docx.js
   */
  public static async exportToWord<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    options?: ExportOptions
  ): Promise<void> {
    const {
      fileName = 'export',
      title = 'Data Export',
      author = 'OrderBookerTargetTracker',
      excludeColumns = [],
    } = options || {};

    try {
      // Filter columns
      const filteredColumns = columns.filter((col) => !excludeColumns.includes(col.dataIndex));

      // Create title paragraph
      const titleParagraph = new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      });

      // Create table
      const tableRows: TableRow[] = [];

      // Add header row
      const headerCells = filteredColumns.map(
        (col) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: col.title,
                    bold: true,
                  }),
                ],
              }),
            ],
            shading: {
              fill: 'E0E0E0',
            },
          })
      );

      tableRows.push(new TableRow({ children: headerCells }));

      // Add data rows
      data.forEach((item) => {
        const cells = filteredColumns.map((col) => {
          let cellValue: string = '';

          if (col.render) {
            cellValue = String(col.render(item[col.dataIndex], item));
          } else {
            cellValue = item[col.dataIndex] !== undefined ? String(item[col.dataIndex]) : '';
          }

          return new TableCell({
            children: [new Paragraph({ text: cellValue })],
          });
        });

        tableRows.push(new TableRow({ children: cells }));
      });

      // Create table
      const table = new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
      });

      // Create document with content
      const doc = new Document({
        creator: author,
        title,
        sections: [
          {
            properties: {},
            children: [titleParagraph, table],
          },
        ],
      });

      // Generate file path using Tauri dialog
      const filePath = await save({
        filters: [
          {
            name: 'Word Documents',
            extensions: ['docx'],
          },
        ],
        defaultPath: `${fileName}.docx`,
      });

      if (filePath) {
        // Use Blob-based approach compatible with Tauri
        const blob = await Packer.toBlob(doc);
        const arrayBuffer = await blob.arrayBuffer();
        await writeFile(filePath, new Uint8Array(arrayBuffer));
      }
    } catch (error) {
      console.error('Error exporting to Word:', error);
      throw error;
    }
  }

  /**
   * Generic export function that handles all export formats
   */
  public static async exportData<T extends Record<string, any>>(
    format: string,
    data: T[],
    columns: ExportColumn[],
    options?: ExportOptions
  ): Promise<void> {
    switch (format.toLowerCase()) {
      case 'excel':
        return this.exportToExcel(data, columns, options);
      case 'pdf':
        return this.exportToPdf(data, columns, options);
      case 'word':
        return this.exportToWord(data, columns, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}
