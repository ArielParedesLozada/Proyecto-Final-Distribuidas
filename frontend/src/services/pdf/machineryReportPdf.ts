import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MachineryTypeReport {
  machineryType: number;
  totalEstimatedConsumption: number;
  totalRealConsumption: number;
  totalDistanceKm: number;
  registerCount: number;
  averageConsumptionPerKm: number;
  differenceLiters: number;
  differencePercentage: number;
}

interface ReportByMachineryTypeResponse {
  reports: MachineryTypeReport[];
  totalEstimatedConsumption: number;
  totalRealConsumption: number;
  totalDistanceKm: number;
  totalRegisters: number;
}

export const generateMachineryReportPdf = (
  data: ReportByMachineryTypeResponse,
  filters?: {
    startDate?: string;
    endDate?: string;
    machineryType?: number | null;
  }
): void => {
  try {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = 20;

    // Configuración de colores (mismo estilo que los otros reportes)
    const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
    const successColor: [number, number, number] = [39, 174, 96]; // Verde
    const dangerColor: [number, number, number] = [231, 76, 60]; // Rojo
    const warningColor: [number, number, number] = [241, 196, 15]; // Amarillo
    const infoColor: [number, number, number] = [59, 130, 246]; // Azul claro

    // Título
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte por Tipo de Maquinaria', margin, yPos);
    yPos += 10;

    // Información de filtros
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    
    const filterText: string[] = [];
    
    if (filters?.startDate && filters?.endDate) {
      filterText.push(`Período: ${new Date(filters.startDate).toLocaleDateString('es-ES')} - ${new Date(filters.endDate).toLocaleDateString('es-ES')}`);
    }
    
    if (filters?.machineryType !== null && filters?.machineryType !== undefined) {
      const machineryType = filters.machineryType === 0 ? 'Liviano' : 'Pesado';
      filterText.push(`Tipo de Maquinaria: ${machineryType}`);
    }
    
    if (filterText.length > 0) {
      doc.text(filterText.join(' | '), margin, yPos);
      yPos += 8;
    }
    
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, yPos);
    yPos += 15;

    // Resumen Ejecutivo
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', margin, yPos);
    yPos += 10;

    // Tarjetas de resumen (mismo estilo que comparisonReportPdf)
    const summaryCards = [
      {
        label: 'Total Estimado',
        value: `${data.totalEstimatedConsumption.toFixed(2)} L`,
        color: primaryColor
      },
      {
        label: 'Total Real',
        value: `${data.totalRealConsumption.toFixed(2)} L`,
        color: successColor
      },
      {
        label: 'Distancia Total',
        value: `${data.totalDistanceKm.toFixed(2)} km`,
        color: infoColor
      },
      {
        label: 'Total Registros',
        value: data.totalRegisters.toString(),
        color: warningColor
      }
    ];

    const cardWidth = 45;
    const cardHeight = 25;
    const cardSpacing = 5;
    let xPos = margin;

    summaryCards.forEach((card) => {
      if (xPos + cardWidth > pageWidth - margin) {
        xPos = margin;
        yPos += cardHeight + cardSpacing;
      }
      
      // Fondo de la tarjeta con color claro
      const lightColor: [number, number, number] = [
        Math.min(255, card.color[0] + 200),
        Math.min(255, card.color[1] + 200),
        Math.min(255, card.color[2] + 200)
      ];
      doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
      
      // Borde
      doc.setDrawColor(card.color[0], card.color[1], card.color[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'S');
      
      // Texto
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, xPos + 3, yPos + 8);
      
      doc.setFontSize(12);
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, xPos + 3, yPos + 18);
      
      xPos += cardWidth + cardSpacing;
    });

    yPos += cardHeight + 15;

    // Reportes por Tipo de Maquinaria
    if (data.reports && data.reports.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Desglose por Tipo de Maquinaria', margin, yPos);
      yPos += 10;

      // Tabla de reportes por tipo
      const tableData = data.reports.map((report) => {
        const typeName = report.machineryType === 0 ? 'Liviano' : 'Pesado';
        
        return [
          typeName,
          report.registerCount.toString(),
          `${report.totalEstimatedConsumption.toFixed(2)} L`,
          `${report.totalRealConsumption.toFixed(2)} L`,
          `${report.totalDistanceKm.toFixed(2)} km`,
          `${report.differenceLiters.toFixed(2)} L`,
          `${report.differencePercentage.toFixed(2)}%`,
          `${report.averageConsumptionPerKm.toFixed(3)} L/km`,
        ];
      });

      // Guardar referencia a los reportes originales para usar en el callback
      const originalReports = data.reports;

      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Registros', 'Estimado (L)', 'Real (L)', 'Distancia (km)', 'Diferencia (L)', 'Diferencia (%)', 'Promedio/km']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' },
          7: { cellWidth: 30, halign: 'right' },
        },
        didParseCell: function(cellData) {
          // Colorear la columna de diferencia porcentual
          if (cellData.column.index === 6 && cellData.row.index > 0) {
            const reportIndex = cellData.row.index - 1;
            if (reportIndex >= 0 && reportIndex < originalReports.length) {
              const report = originalReports[reportIndex];
              const percentage = report.differencePercentage;
              if (percentage > 10) {
                cellData.cell.styles.textColor = dangerColor;
                cellData.cell.styles.fontStyle = 'bold';
              } else if (percentage < -10) {
                cellData.cell.styles.textColor = successColor;
                cellData.cell.styles.fontStyle = 'bold';
              } else {
                cellData.cell.styles.textColor = warningColor;
              }
            }
          }
          
          // Colorear consumo real
          if (cellData.column.index === 3 && cellData.row.index > 0) {
            cellData.cell.styles.textColor = successColor;
          }
          
          // Colorear consumo estimado
          if (cellData.column.index === 2 && cellData.row.index > 0) {
            cellData.cell.styles.textColor = primaryColor;
          }
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount} - Reporte por Tipo de Maquinaria`,
        margin,
        pageHeight - 10
      );
    }

    // Descargar el PDF
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `reporte-maquinaria-${dateStr}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

