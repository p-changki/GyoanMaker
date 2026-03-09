"use client";

import { useCallback, useState } from "react";

export function useTestExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async (fileName: string) => {
    setIsExporting(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const parts = Array.from(
        document.querySelectorAll<HTMLElement>("[data-pdf-part]")
      ).sort((a, b) => {
        return parseInt(a.dataset.pdfOrder ?? "0", 10) - parseInt(b.dataset.pdfOrder ?? "0", 10);
      });

      if (parts.length === 0) {
        throw new Error("No exportable content found.");
      }

      const scale = Math.max(2, window.devicePixelRatio || 1);
      let pdf: InstanceType<typeof jsPDF> | null = null;
      const a4WidthMm = 210;

      for (const element of parts) {
        const originalStyles = {
          width: element.style.width,
          minWidth: element.style.minWidth,
          maxWidth: element.style.maxWidth,
        };

        try {
          element.style.width = "794px";
          element.style.minWidth = "794px";
          element.style.maxWidth = "794px";

          const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            windowWidth: 794,
          });

          const imageData = canvas.toDataURL("image/png");
          const imageHeight = (canvas.height * a4WidthMm) / canvas.width;

          if (!pdf) {
            pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: [a4WidthMm, Math.max(297, imageHeight)],
            });
          } else {
            pdf.addPage([a4WidthMm, Math.max(297, imageHeight)]);
          }

          pdf.addImage(imageData, "PNG", 0, 0, a4WidthMm, imageHeight, undefined, "FAST");

          canvas.width = 1;
          canvas.height = 1;
          await new Promise((resolve) => setTimeout(resolve, 50));
        } finally {
          element.style.width = originalStyles.width;
          element.style.minWidth = originalStyles.minWidth;
          element.style.maxWidth = originalStyles.maxWidth;
        }
      }

      if (!pdf) return;
      pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportPDF };
}
