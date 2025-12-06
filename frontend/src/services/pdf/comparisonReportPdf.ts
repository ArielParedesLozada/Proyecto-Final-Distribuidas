import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ConsumptionComparisonResponse, ConsumptionComparisonItem } from '../../pages/admin/AdminReports';

/**
 * Genera un PDF con el reporte global de comparación de consumo
 */
export const generateComparisonReportPdf = (
  data: ConsumptionComparisonResponse,
  filters?: {
    startDate?: string;
    endDate?: string;
    machineryType?: number | null;
  }
): void => {
  try {
    const doc = new jsPDF('landscape'); // Modo horizontal para más espacio
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
  const successColor: [number, number, number] = [39, 174, 96]; // Verde
  const dangerColor: [number, number, number] = [231, 76, 60]; // Rojo
  const warningColor: [number, number, number] = [241, 196, 15]; // Amarillo
  
  // Título
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Reporte de Comparación: Estimado vs Real', 14, 20);
  
  // Información de filtros
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 30;
  const filterText: string[] = [];
  
  if (filters?.startDate && filters?.endDate) {
    filterText.push(`Período: ${new Date(filters.startDate).toLocaleDateString('es-ES')} - ${new Date(filters.endDate).toLocaleDateString('es-ES')}`);
  }
  
  if (filters?.machineryType !== null && filters?.machineryType !== undefined) {
    const machineryType = filters.machineryType === 0 ? 'Liviano' : 'Pesado';
    filterText.push(`Tipo de Maquinaria: ${machineryType}`);
  }
  
  if (filterText.length > 0) {
    doc.text(filterText.join(' | '), 14, yPos);
    yPos += 8;
  }
  
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, yPos);
  yPos += 15;
  
  // Resumen ejecutivo
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Ejecutivo', 14, yPos);
  yPos += 10;
  
  // Tarjetas de resumen
  const diffColor = data.summary.averageDifferencePercentage > 10 ? dangerColor : data.summary.averageDifferencePercentage < -10 ? successColor : warningColor;
  const summaryCards = [
    {
      label: 'Total Estimado',
      value: `${data.summary.totalEstimated.toFixed(2)} L`,
      color: primaryColor
    },
    {
      label: 'Total Real',
      value: `${data.summary.totalReal.toFixed(2)} L`,
      color: successColor
    },
    {
      label: 'Diferencia',
      value: `${data.summary.totalDifference.toFixed(2)} L`,
      color: diffColor
    },
    {
      label: 'Promedio Diferencia',
      value: `${data.summary.averageDifferencePercentage.toFixed(2)}%`,
      color: diffColor
    }
  ];
  
  const cardWidth = 45;
  const cardHeight = 25;
  const cardSpacing = 5;
  let xPos = 14;
  
  summaryCards.forEach((card, index) => {
    if (xPos + cardWidth > doc.internal.pageSize.width - 14) {
      xPos = 14;
      yPos += cardHeight + cardSpacing;
    }
    
    // Fondo de la tarjeta con color claro (sin usar setAlpha que no existe)
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
  
  // Estadísticas adicionales
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const stats = [
    `Total de Rutas: ${data.summary.totalRoutes}`,
    `Sobreestimación: ${data.summary.routesOverEstimate} rutas`,
    `Subestimación: ${data.summary.routesUnderEstimate} rutas`
  ];
  
  stats.forEach((stat, index) => {
    doc.text(stat, 14, yPos + (index * 7));
  });
  
  yPos += stats.length * 7 + 10;
  
  // Tabla detallada de rutas
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle por Ruta', 14, yPos);
  yPos += 10;
  
  // Guardar referencia a los items originales para usar en el callback
  const originalItems = data.items;
  
  const tableData = originalItems.map((item: ConsumptionComparisonItem) => [
    item.routeId.substring(0, 8) + '...',
    item.machineryType === 0 ? 'Liviano' : 'Pesado',
    `${item.estimatedConsumption.toFixed(2)} L`,
    `${item.realConsumption.toFixed(2)} L`,
    `${item.distanceKm.toFixed(2)} km`,
    `${item.differenceLiters.toFixed(2)} L`,
    `${item.differencePercentage.toFixed(2)}%`,
    new Date(item.completedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Ruta ID', 'Tipo', 'Estimado (L)', 'Real (L)', 'Distancia (km)', 'Diferencia (L)', 'Diferencia (%)', 'Fecha']],
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
      1: { cellWidth: 25 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 35 }
    },
    didParseCell: function(cellData) {
      // Colorear la columna de diferencia porcentual
      if (cellData.column.index === 6 && cellData.row.index > 0) {
        const itemIndex = cellData.row.index - 1;
        if (itemIndex >= 0 && itemIndex < originalItems.length) {
          const item = originalItems[itemIndex];
          const percentage = item.differencePercentage;
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
    }
  });
  
  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} - Reporte de Comparación de Consumo`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
    // Descargar el PDF
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `reporte-comparacion-${dateStr}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

