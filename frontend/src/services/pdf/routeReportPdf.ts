import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ConsumptionComparisonItem } from '../../pages/admin/AdminReports';

/**
 * Genera un PDF con el reporte detallado de una ruta individual
 */
export const generateRouteReportPdf = (item: ConsumptionComparisonItem): void => {
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
  const successColor: [number, number, number] = [39, 174, 96]; // Verde
  const dangerColor: [number, number, number] = [231, 76, 60]; // Rojo
  const warningColor: [number, number, number] = [241, 196, 15]; // Amarillo
  
  // Título
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Reporte de Ruta - Consumo de Combustible', 14, 20);
  
  // Información de la ruta
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 35;
  
  // ID de Ruta
  doc.setFont('helvetica', 'bold');
  doc.text('ID de Ruta:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(item.routeId, 50, yPos);
  yPos += 8;
  
  // Tipo de Maquinaria
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Maquinaria:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  const machineryType = item.machineryType === 0 ? 'Liviano' : 'Pesado';
  doc.text(machineryType, 70, yPos);
  yPos += 8;
  
  // Fecha de Finalización
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Finalización:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  const date = new Date(item.completedAt);
  const formattedDate = date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(formattedDate, 70, yPos);
  yPos += 15;
  
  // Tabla de consumo
  const tableData = [
    [
      'Consumo Estimado',
      `${item.estimatedConsumption.toFixed(2)} L`,
      'blue'
    ],
    [
      'Consumo Real',
      `${item.realConsumption.toFixed(2)} L`,
      'green'
    ],
    [
      'Distancia Recorrida',
      `${item.distanceKm.toFixed(2)} km`,
      'normal'
    ],
    [
      'Diferencia',
      `${item.differenceLiters.toFixed(2)} L (${item.differencePercentage.toFixed(2)}%)`,
      item.differencePercentage > 10 ? 'red' : item.differencePercentage < -10 ? 'green' : 'orange'
    ]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Valor']],
    body: tableData.map(row => [row[0], row[1]]),
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { cellWidth: 80, halign: 'right' }
    },
    didParseCell: function(data) {
      const rowIndex = data.row.index;
      if (rowIndex > 0 && tableData[rowIndex - 1]) {
        const color = tableData[rowIndex - 1][2];
        if (color === 'red') {
          data.cell.styles.textColor = dangerColor;
        } else if (color === 'green') {
          data.cell.styles.textColor = successColor;
        } else if (color === 'orange') {
          data.cell.styles.textColor = warningColor;
        } else if (color === 'blue') {
          data.cell.styles.textColor = primaryColor;
        }
      }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Análisis de sobreestimación
  if (item.differencePercentage > 10) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
    doc.setFontSize(12);
    doc.text('Sobreestimacion Detectada', 14, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `El consumo real (${item.realConsumption.toFixed(2)} L) excedio el estimado ` +
      `(${item.estimatedConsumption.toFixed(2)} L) en un ${item.differencePercentage.toFixed(2)}%.`,
      14,
      yPos,
      { maxWidth: 180 }
    );
    yPos += 10;
  } else if (item.differencePercentage < -10) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.setFontSize(12);
    doc.text('Eficiencia Detectada', 14, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `El consumo real (${item.realConsumption.toFixed(2)} L) fue menor al estimado ` +
      `(${item.estimatedConsumption.toFixed(2)} L) en un ${Math.abs(item.differencePercentage).toFixed(2)}%.`,
      14,
      yPos,
      { maxWidth: 180 }
    );
    yPos += 10;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.setFontSize(12);
    doc.text('Consumo Dentro del Rango Esperado', 14, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `El consumo real (${item.realConsumption.toFixed(2)} L) esta dentro del rango esperado ` +
      `respecto al estimado (${item.estimatedConsumption.toFixed(2)} L).`,
      14,
      yPos,
      { maxWidth: 180 }
    );
    yPos += 10;
  }
  
  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Descargar el PDF
  const fileName = `reporte-ruta-${item.routeId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

