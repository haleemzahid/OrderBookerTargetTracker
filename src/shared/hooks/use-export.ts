import { useState } from 'react';
import { ExportService, ExportColumn, ExportOptions } from '../utils/export/exportService';
import { message } from 'antd';

interface UseExportOptions extends ExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for handling exports with feedback
 */
export const useExport = <T extends Record<string, any>>(
  options?: UseExportOptions
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);

  const exportData = async (
    format: string,
    data: T[],
    columns: ExportColumn[],
    exportOptions?: ExportOptions
  ) => {
    try {
      setIsExporting(true);
      setExportError(null);

      await ExportService.exportData(
        format,
        data,
        columns,
        {
          ...options,
          ...exportOptions,
        }
      );

      message.success(`Successfully exported to ${format.toUpperCase()}`);
      options?.onSuccess?.();
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      const err = error instanceof Error ? error : new Error(String(error));
      setExportError(err);
      message.error(`Failed to export to ${format}: ${err.message}`);
      options?.onError?.(err);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
    exportError
  };
};
