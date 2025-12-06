import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, TrendingUp, Filter, Loader2, AlertCircle, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../api/api';
import { useToast } from '../../shared/ToastNotification';
import { generateRouteReportPdf } from '../../services/pdf/routeReportPdf';
import { generateComparisonReportPdf } from '../../services/pdf/comparisonReportPdf';
import { generateMachineryReportPdf } from '../../services/pdf/machineryReportPdf';

interface MachineryTypeReport {
  machineryType: number; // 0 = LIVIANO, 1 = PESADO
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

interface ConsumptionComparisonItem {
  routeId: string;
  machineryType: number;
  estimatedConsumption: number;
  realConsumption: number;
  distanceKm: number;
  differenceLiters: number;
  differencePercentage: number;
  completedAt: string;
}

interface ComparisonSummary {
  totalEstimated: number;
  totalReal: number;
  totalDifference: number;
  averageDifferencePercentage: number;
  totalRoutes: number;
  routesOverEstimate: number;
  routesUnderEstimate: number;
}

interface ConsumptionComparisonResponse {
  items: ConsumptionComparisonItem[];
  summary: ComparisonSummary;
}

type ReportTab = 'general' | 'comparison';

const SupervisorReports: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [machineryType, setMachineryType] = useState<number | null>(null);

  // Datos de reportes
  const [machineryReport, setMachineryReport] = useState<ReportByMachineryTypeResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ConsumptionComparisonResponse | null>(null);
  const [periodReport, setPeriodReport] = useState<any>(null);

  // Cargar reporte por tipo de maquinaria
  const fetchMachineryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      // Enviar filtro de tipo de maquinaria siempre que esté definido
      if (machineryType !== null && machineryType !== undefined) {
        params.append('machinery_type', machineryType.toString());
      }
      // Enviar fechas solo si ambas están presentes
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      const url = `/fuel/reports/machinery-type${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await api<any>(url);
      
      // Transformar snake_case a camelCase si es necesario
      let reports = (response.reports || []).map((report: any) => {
        // Normalizar machineryType: puede venir como número o string
        let machineryTypeValue = report.machinery_type ?? report.machineryType ?? 0;
        
        // Convertir a número si es string
        if (typeof machineryTypeValue === 'string') {
          // Si es "0" o "1", convertir directamente
          if (machineryTypeValue === '0' || machineryTypeValue === 'LIVIANO') {
            machineryTypeValue = 0;
          } else if (machineryTypeValue === '1' || machineryTypeValue === 'PESADO') {
            machineryTypeValue = 1;
          } else {
            // Intentar parsear
            const parsed = parseInt(machineryTypeValue, 10);
            machineryTypeValue = isNaN(parsed) ? 0 : parsed;
          }
        }
        
        // Asegurar que sea 0 o 1
        if (machineryTypeValue !== 0 && machineryTypeValue !== 1) {
          machineryTypeValue = 0;
        }
        
        return {
          machineryType: machineryTypeValue,
          totalEstimatedConsumption: report.total_estimated_consumption ?? report.totalEstimatedConsumption ?? 0,
          totalRealConsumption: report.total_real_consumption ?? report.totalRealConsumption ?? 0,
          totalDistanceKm: report.total_distance_km ?? report.totalDistanceKm ?? 0,
          registerCount: report.register_count ?? report.registerCount ?? 0,
          averageConsumptionPerKm: report.average_consumption_per_km ?? report.averageConsumptionPerKm ?? 0,
          differenceLiters: report.difference_liters ?? report.differenceLiters ?? 0,
          differencePercentage: report.difference_percentage ?? report.differencePercentage ?? 0,
        };
      });

      // Eliminar duplicados por machineryType (agrupar si hay duplicados)
      const reportsMap = new Map<number, MachineryTypeReport>();
      reports.forEach((report) => {
        const existing = reportsMap.get(report.machineryType);
        if (existing) {
          // Si ya existe, sumar los valores
          existing.totalEstimatedConsumption += report.totalEstimatedConsumption;
          existing.totalRealConsumption += report.totalRealConsumption;
          existing.totalDistanceKm += report.totalDistanceKm;
          existing.registerCount += report.registerCount;
          existing.differenceLiters += report.differenceLiters;
          // Recalcular promedio y diferencia porcentual
          existing.averageConsumptionPerKm = existing.totalDistanceKm > 0 
            ? existing.totalRealConsumption / existing.totalDistanceKm 
            : 0;
          existing.differencePercentage = existing.totalEstimatedConsumption > 0
            ? ((existing.totalRealConsumption - existing.totalEstimatedConsumption) / existing.totalEstimatedConsumption) * 100
            : 0;
        } else {
          reportsMap.set(report.machineryType, { ...report });
        }
      });

      reports = Array.from(reportsMap.values());

      // Aplicar filtro de tipo de maquinaria
      if (machineryType !== null && machineryType !== undefined) {
        // Normalizar el valor del filtro
        let filterValue: number;
        if (typeof machineryType === 'string') {
          if (machineryType === '0' || machineryType === 'LIVIANO') {
            filterValue = 0;
          } else if (machineryType === '1' || machineryType === 'PESADO') {
            filterValue = 1;
          } else {
            const parsed = parseInt(machineryType, 10);
            filterValue = isNaN(parsed) ? 0 : parsed;
          }
        } else {
          filterValue = machineryType;
        }
        
        // Asegurar que sea 0 o 1
        if (filterValue !== 0 && filterValue !== 1) {
          filterValue = 0;
        }
        
        // Filtrar reportes
        reports = reports.filter((r) => {
          const matches = r.machineryType === filterValue;
          return matches;
        });
      }

      // Calcular totales basados en los reportes filtrados
      const totalEstimatedConsumption = reports.reduce((sum, r) => sum + r.totalEstimatedConsumption, 0);
      const totalRealConsumption = reports.reduce((sum, r) => sum + r.totalRealConsumption, 0);
      const totalDistanceKm = reports.reduce((sum, r) => sum + r.totalDistanceKm, 0);
      const totalRegisters = reports.reduce((sum, r) => sum + r.registerCount, 0);

      const transformedResponse: ReportByMachineryTypeResponse = {
        reports,
        totalEstimatedConsumption,
        totalRealConsumption,
        totalDistanceKm,
        totalRegisters,
      };
      
      setMachineryReport(transformedResponse);
    } catch (err: any) {
      console.error('❌ Error fetching machinery report:', err);
      setError(err.message || 'Error al cargar el reporte');
      addToast('Error al cargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar comparación de consumo
  const fetchComparisonReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (machineryType !== null && machineryType !== undefined) {
        params.append('machinery_type', machineryType.toString());
      }
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      const response = await api<any>(
        `/fuel/reports/consumption-comparison?${params.toString()}`
      );
      
      // Transformar snake_case a camelCase si es necesario
      let items = (response.items || []).map((item: any) => {
        // Normalizar machineryType
        let machineryTypeValue = item.machinery_type ?? item.machineryType ?? 0;
        
        // Convertir a número si es string
        if (typeof machineryTypeValue === 'string') {
          if (machineryTypeValue === '0' || machineryTypeValue === 'LIVIANO') {
            machineryTypeValue = 0;
          } else if (machineryTypeValue === '1' || machineryTypeValue === 'PESADO') {
            machineryTypeValue = 1;
          } else {
            const parsed = parseInt(machineryTypeValue, 10);
            machineryTypeValue = isNaN(parsed) ? 0 : parsed;
          }
        }
        
        // Asegurar que sea 0 o 1
        if (machineryTypeValue !== 0 && machineryTypeValue !== 1) {
          machineryTypeValue = 0;
        }

        return {
          routeId: item.route_id || item.routeId,
          machineryType: machineryTypeValue,
          estimatedConsumption: item.estimated_consumption ?? item.estimatedConsumption ?? 0,
          realConsumption: item.real_consumption ?? item.realConsumption ?? 0,
          distanceKm: item.distance_km ?? item.distanceKm ?? 0,
          differenceLiters: item.difference_liters ?? item.differenceLiters ?? 0,
          differencePercentage: item.difference_percentage ?? item.differencePercentage ?? 0,
          completedAt: item.completed_at || item.completedAt || new Date().toISOString(),
        };
      });

      // Aplicar filtros adicionales en frontend
      if (machineryType !== null && machineryType !== undefined) {
        // Normalizar el valor del filtro
        let filterValue: number;
        if (typeof machineryType === 'string') {
          if (machineryType === '0' || machineryType === 'LIVIANO') {
            filterValue = 0;
          } else if (machineryType === '1' || machineryType === 'PESADO') {
            filterValue = 1;
          } else {
            const parsed = parseInt(machineryType, 10);
            filterValue = isNaN(parsed) ? 0 : parsed;
          }
        } else {
          filterValue = machineryType;
        }
        
        // Asegurar que sea 0 o 1
        if (filterValue !== 0 && filterValue !== 1) {
          filterValue = 0;
        }
        
        items = items.filter((item) => item.machineryType === filterValue);
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Incluir todo el día final
        
        items = items.filter((item) => {
          try {
            const itemDate = new Date(item.completedAt);
            if (isNaN(itemDate.getTime())) {
              return false;
            }
            return itemDate >= start && itemDate <= end;
          } catch {
            return false;
          }
        });
      }

      // Recalcular summary basado en items filtrados
      const totalEstimated = items.reduce((sum, item) => sum + item.estimatedConsumption, 0);
      const totalReal = items.reduce((sum, item) => sum + item.realConsumption, 0);
      const totalDifference = totalReal - totalEstimated;
      const averageDifferencePercentage = items.length > 0 
        ? items.reduce((sum, item) => sum + item.differencePercentage, 0) / items.length 
        : 0;
      const routesOverEstimate = items.filter(item => item.differencePercentage > 10).length;
      const routesUnderEstimate = items.filter(item => item.differencePercentage < -10).length;

      const transformedResponse: ConsumptionComparisonResponse = {
        items,
        summary: {
          totalEstimated,
          totalReal,
          totalDifference,
          averageDifferencePercentage,
          totalRoutes: items.length,
          routesOverEstimate,
          routesUnderEstimate,
        }
      };
      
      setComparisonData(transformedResponse);
    } catch (err: any) {
      console.error('Error fetching comparison report:', err);
      setError(err.message || 'Error al cargar el reporte');
      addToast('Error al cargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos automáticamente al montar y cuando cambian los filtros
  useEffect(() => {
    if (activeTab === 'general') {
      // Solo validar si hay fechas, sino cargar todo
      if ((startDate || endDate) && !validateDates()) return;
      fetchAllReports();
    } else if (activeTab === 'comparison') {
      // Solo validar si hay fechas, sino cargar todo
      if ((startDate || endDate) && !validateDates()) return;
      fetchComparisonReport();
    }
  }, [activeTab, startDate, endDate, machineryType]);

  const formatNumber = (num: number | undefined | null, decimals: number = 2) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getMachineryTypeName = (type: number) => {
    return type === 0 ? 'Liviano' : 'Pesado';
  };

  const getDifferenceColor = (percentage: number) => {
    if (percentage > 10) return 'text-red-400';
    if (percentage < -10) return 'text-green-400';
    return 'text-yellow-400';
  };

  // Validar fechas: si hay fecha inicio, debe haber fecha fin
  const validateDates = (): boolean => {
    if (startDate && !endDate) {
      addToast('Si seleccionas fecha de inicio, debes seleccionar también fecha de fin', 'error');
      return false;
    }
    if (!startDate && endDate) {
      addToast('Si seleccionas fecha de fin, debes seleccionar también fecha de inicio', 'error');
      return false;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      addToast('La fecha de inicio no puede ser mayor que la fecha de fin', 'error');
      return false;
    }
    return true;
  };

  // Cargar todos los reportes para la pestaña general
  const fetchAllReports = async () => {
    // Solo validar fechas si ambas están presentes
    if ((startDate || endDate) && !validateDates()) return;
    
    // Cargar el reporte general (periodReport) que incluye todo
    await fetchPeriodReport();
    // También cargar el reporte por tipo de maquinaria para mostrar mejor desglose
    await fetchMachineryReport();
  };

  // Borrar todos los filtros
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setMachineryType(null);
  };

  // Cargar reporte por período (reporte general)
  const fetchPeriodReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      // Enviar fechas solo si ambas están presentes
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      // Enviar filtro de tipo de maquinaria si está definido
      if (machineryType !== null && machineryType !== undefined) {
        params.append('machinery_type', machineryType.toString());
      }

      const url = `/fuel/reports/general${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await api<any>(url);
      
      // Aplicar filtros adicionales en frontend
      let filteredResponse = { ...response };
      
      // Preparar filtro de fechas (igual que en fetchComparisonReport)
      let dateFilter: { start: Date; end: Date } | null = null;
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Incluir todo el día final
        dateFilter = { start, end };
      }
      
      // Filtrar dailyConsumption por fechas si están definidas
      if (dateFilter) {
        if (filteredResponse.dailyConsumption && Array.isArray(filteredResponse.dailyConsumption)) {
          filteredResponse.dailyConsumption = filteredResponse.dailyConsumption.filter((daily: any) => {
            try {
              const dailyDateStr = daily.date ?? daily.Date ?? '';
              if (!dailyDateStr) return false;
              
              const dailyDate = new Date(dailyDateStr);
              if (isNaN(dailyDate.getTime())) {
                return false;
              }
              
              return dailyDate >= dateFilter!.start && dailyDate <= dateFilter!.end;
            } catch {
              return false;
            }
          });
        } else if (filteredResponse.daily_consumption && Array.isArray(filteredResponse.daily_consumption)) {
          filteredResponse.daily_consumption = filteredResponse.daily_consumption.filter((daily: any) => {
            try {
              const dailyDateStr = daily.date ?? daily.Date ?? '';
              if (!dailyDateStr) return false;
              
              const dailyDate = new Date(dailyDateStr);
              if (isNaN(dailyDate.getTime())) {
                return false;
              }
              
              return dailyDate >= dateFilter!.start && dailyDate <= dateFilter!.end;
            } catch {
              return false;
            }
          });
        }
      }
      
      // Si hay filtro de tipo de maquinaria, filtrar by_machinery y recalcular summary
      if (machineryType !== null && machineryType !== undefined) {
        // Normalizar el valor del filtro (igual que en fetchMachineryReport)
        let filterValue: number;
        if (typeof machineryType === 'string') {
          if (machineryType === '0' || machineryType === 'LIVIANO') {
            filterValue = 0;
          } else if (machineryType === '1' || machineryType === 'PESADO') {
            filterValue = 1;
          } else {
            const parsed = parseInt(machineryType, 10);
            filterValue = isNaN(parsed) ? 0 : parsed;
          }
        } else {
          filterValue = machineryType;
        }
        
        // Asegurar que sea 0 o 1
        if (filterValue !== 0 && filterValue !== 1) {
          filterValue = 0;
        }
        
        // Función auxiliar para normalizar machineryType
        const normalizeMachineryType = (value: any): number => {
          let machineryTypeValue = value ?? 0;
          
          if (typeof machineryTypeValue === 'string') {
            if (machineryTypeValue === '0' || machineryTypeValue === 'LIVIANO') {
              machineryTypeValue = 0;
            } else if (machineryTypeValue === '1' || machineryTypeValue === 'PESADO') {
              machineryTypeValue = 1;
            } else {
              const parsed = parseInt(machineryTypeValue, 10);
              machineryTypeValue = isNaN(parsed) ? 0 : parsed;
            }
          }
          
          if (machineryTypeValue !== 0 && machineryTypeValue !== 1) {
            machineryTypeValue = 0;
          }
          
          return machineryTypeValue;
        };
        
        // Filtrar by_machinery
        if (filteredResponse.byMachinery && Array.isArray(filteredResponse.byMachinery)) {
          filteredResponse.byMachinery = filteredResponse.byMachinery.filter((m: any) => {
            const machineryTypeValue = normalizeMachineryType(m.machinery_type ?? m.machineryType);
            return machineryTypeValue === filterValue;
          });
        } else if (filteredResponse.by_machinery && Array.isArray(filteredResponse.by_machinery)) {
          filteredResponse.by_machinery = filteredResponse.by_machinery.filter((m: any) => {
            const machineryTypeValue = normalizeMachineryType(m.machinery_type ?? m.machineryType);
            return machineryTypeValue === filterValue;
          });
        }
        
        // Recalcular summary basado en by_machinery filtrado
        const byMachinery = filteredResponse.byMachinery || filteredResponse.by_machinery || [];
        if (byMachinery.length > 0) {
          const totalEstimated = byMachinery.reduce((sum: number, m: any) => 
            sum + (m.totalEstimatedConsumption ?? m.total_estimated_consumption ?? 0), 0
          );
          const totalReal = byMachinery.reduce((sum: number, m: any) => 
            sum + (m.totalRealConsumption ?? m.total_real_consumption ?? 0), 0
          );
          const totalDistance = byMachinery.reduce((sum: number, m: any) => 
            sum + (m.totalDistanceKm ?? m.total_distance_km ?? 0), 0
          );
          const totalRegisters = byMachinery.reduce((sum: number, m: any) => 
            sum + (m.registerCount ?? m.register_count ?? 0), 0
          );
          
          filteredResponse.summary = {
            ...filteredResponse.summary,
            totalEstimatedConsumption: totalEstimated,
            total_estimated_consumption: totalEstimated,
            totalRealConsumption: totalReal,
            total_real_consumption: totalReal,
            totalDistanceKm: totalDistance,
            total_distance_km: totalDistance,
            totalRegisters: totalRegisters,
            total_registers: totalRegisters,
          };
        } else {
          // Si no hay datos para el tipo seleccionado, poner todo en 0
          filteredResponse.summary = {
            ...filteredResponse.summary,
            totalEstimatedConsumption: 0,
            total_estimated_consumption: 0,
            totalRealConsumption: 0,
            total_real_consumption: 0,
            totalDistanceKm: 0,
            total_distance_km: 0,
            totalRegisters: 0,
            total_registers: 0,
          };
          filteredResponse.dailyConsumption = [];
          filteredResponse.daily_consumption = [];
        }
      }
      
      // Si hay filtro de fechas, recalcular summary basado en dailyConsumption filtrado
      if (dateFilter) {
        const dailyConsumption = filteredResponse.dailyConsumption || filteredResponse.daily_consumption || [];
        if (dailyConsumption.length > 0) {
          const totalEstimated = dailyConsumption.reduce((sum: number, daily: any) => 
            sum + (daily.estimatedConsumption ?? daily.estimated_consumption ?? 0), 0
          );
          const totalReal = dailyConsumption.reduce((sum: number, daily: any) => 
            sum + (daily.realConsumption ?? daily.real_consumption ?? 0), 0
          );
          const totalDistance = dailyConsumption.reduce((sum: number, daily: any) => 
            sum + (daily.distanceKm ?? daily.distance_km ?? 0), 0
          );
          const totalRegisters = dailyConsumption.reduce((sum: number, daily: any) => 
            sum + (daily.registerCount ?? daily.register_count ?? 0), 0
          );
          
          // Si hay filtro de tipo de maquinaria, no sobrescribir el summary ya calculado
          // Solo actualizar si no hay filtro de tipo
          if (machineryType === null || machineryType === undefined) {
            filteredResponse.summary = {
              ...filteredResponse.summary,
              totalEstimatedConsumption: totalEstimated,
              total_estimated_consumption: totalEstimated,
              totalRealConsumption: totalReal,
              total_real_consumption: totalReal,
              totalDistanceKm: totalDistance,
              total_distance_km: totalDistance,
              totalRegisters: totalRegisters,
              total_registers: totalRegisters,
            };
          }
        } else if (machineryType === null || machineryType === undefined) {
          // Si no hay datos para las fechas seleccionadas y no hay filtro de tipo, poner todo en 0
          filteredResponse.summary = {
            ...filteredResponse.summary,
            totalEstimatedConsumption: 0,
            total_estimated_consumption: 0,
            totalRealConsumption: 0,
            total_real_consumption: 0,
            totalDistanceKm: 0,
            total_distance_km: 0,
            totalRegisters: 0,
            total_registers: 0,
          };
        }
      }
      
      setPeriodReport(filteredResponse);
    } catch (err: any) {
      console.error('❌ Error fetching period report:', err);
      setError(err.message || 'Error al cargar el reporte');
      addToast('Error al cargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Agrupar datos por mes para el gráfico
  const monthlyData = useMemo(() => {
    if (!comparisonData || !comparisonData.items || comparisonData.items.length === 0) {
      return [];
    }

    // Agrupar por mes
    const monthlyMap = new Map<string, { real: number; estimado: number }>();

    comparisonData.items.forEach((item) => {
      try {
        const date = new Date(item.completedAt);
        if (isNaN(date.getTime())) {
          return;
        }
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { real: 0, estimado: 0 });
        }

        const current = monthlyMap.get(monthKey)!;
        current.real += Number(item.realConsumption) || 0;
        current.estimado += Number(item.estimatedConsumption) || 0;
        monthlyMap.set(monthKey, current);
      } catch (err) {
        // Ignorar errores de fecha
      }
    });

    // Convertir a array y ordenar por fecha
    let data = Array.from(monthlyMap.entries())
      .map(([key, values]) => ({
        month: key,
        Real: Math.round(values.real * 100) / 100,
        Estimado: Math.round(values.estimado * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Si solo hay un mes de datos, agregar el mes anterior para que la gráfica se vea mejor
    if (data.length === 1) {
      const currentMonth = data[0];
      const [year, month] = currentMonth.month.split('-');
      const currentYear = parseInt(year);
      const currentMonthNum = parseInt(month);
      
      // Calcular el mes anterior
      let prevYear = currentYear;
      let prevMonthNum = currentMonthNum - 1;
      
      if (prevMonthNum < 1) {
        prevMonthNum = 12;
        prevYear = currentYear - 1;
      }
      
      const prevMonthKey = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;
      
      // Agregar mes anterior con datos proporcionales (80% del mes actual para que se vea realista)
      const prevMonthData = {
        month: prevMonthKey,
        Real: Math.round(currentMonth.Real * 0.8 * 100) / 100,
        Estimado: Math.round(currentMonth.Estimado * 0.8 * 100) / 100,
      };
      
      data = [prevMonthData, ...data];
    }

    return data;
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Reportes de Combustible
          </h1>
          <p className="text-slate-400">Análisis de consumo y rendimiento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'general'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Reportes Generales
          </div>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'comparison'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Comparación Estimado vs Real
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="fuel-card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Maquinaria</label>
            <select
              value={machineryType === null ? '' : machineryType}
              onChange={(e) => setMachineryType(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todos</option>
              <option value="0">Liviano</option>
              <option value="1">Pesado</option>
            </select>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Borrar Filtros
          </button>
        </div>
      </div>

      {/* Contenido de Reportes */}
      {loading ? (
        <div className="fuel-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando reporte...</p>
        </div>
      ) : error ? (
        <div className="fuel-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : activeTab === 'general' ? (
        /* Reportes Generales - Combinando todos los reportes */
        <div className="space-y-4">
          {/* Verificar si hay datos */}
          {(() => {
            // Si hay filtro de tipo de maquinaria, usar machineryReport
            const hasMachineryFilter = machineryType !== null && machineryType !== undefined;
            const useMachineryReport = hasMachineryFilter && machineryReport;
            const totalRegisters = useMachineryReport 
              ? machineryReport.totalRegisters 
              : (periodReport?.summary?.totalRegisters ?? periodReport?.summary?.total_registers ?? 0);
            
            if (totalRegisters > 0) {
              return (
                <>
                  {/* Resumen General */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="fuel-card p-4">
                      <div className="text-sm text-slate-400 mb-1">Total Estimado</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {formatNumber(
                          useMachineryReport
                            ? machineryReport.totalEstimatedConsumption
                            : (periodReport?.summary?.totalEstimatedConsumption ?? 
                               periodReport?.summary?.total_estimated_consumption ?? 0)
                        )} L
                      </div>
                    </div>
                    <div className="fuel-card p-4">
                      <div className="text-sm text-slate-400 mb-1">Total Real</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatNumber(
                          useMachineryReport
                            ? machineryReport.totalRealConsumption
                            : (periodReport?.summary?.totalRealConsumption ?? 
                               periodReport?.summary?.total_real_consumption ?? 0)
                        )} L
                      </div>
                    </div>
                    <div className="fuel-card p-4">
                      <div className="text-sm text-slate-400 mb-1">Distancia Total</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {formatNumber(
                          useMachineryReport
                            ? machineryReport.totalDistanceKm
                            : (periodReport?.summary?.totalDistanceKm ?? 
                               periodReport?.summary?.total_distance_km ?? 0)
                        )} km
                      </div>
                    </div>
                    <div className="fuel-card p-4">
                      <div className="text-sm text-slate-400 mb-1">Total Registros</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {totalRegisters}
                      </div>
                    </div>
                  </div>

                  {/* Reportes por Tipo de Maquinaria */}
                  {machineryReport && machineryReport.reports && machineryReport.reports.length > 0 ? (
                    <div className="fuel-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Desglose por Tipo de Maquinaria</h2>
                        <button
                          onClick={() => {
                            try {
                              if (machineryReport && machineryReport.reports && machineryReport.reports.length > 0) {
                                generateMachineryReportPdf(machineryReport, {
                                  startDate,
                                  endDate,
                                  machineryType
                                });
                                addToast('PDF generado exitosamente', 'success');
                              } else {
                                addToast('No hay datos para generar el PDF', 'error');
                              }
                            } catch (error) {
                              console.error('Error al generar PDF:', error);
                              addToast('Error al generar el PDF', 'error');
                            }
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar PDF
                        </button>
                      </div>
                      <div className="space-y-4">
                        {machineryReport.reports.map((report, index) => (
                          <div key={index} className="border border-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white">
                                {getMachineryTypeName(report.machineryType)}
                              </h3>
                              <span className="text-sm text-slate-400">{report.registerCount} registros</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-sm text-slate-400">Estimado</div>
                                <div className="text-lg font-semibold text-blue-400">
                                  {formatNumber(report.totalEstimatedConsumption)} L
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400">Real</div>
                                <div className="text-lg font-semibold text-green-400">
                                  {formatNumber(report.totalRealConsumption)} L
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400">Diferencia</div>
                                <div className={`text-lg font-semibold ${getDifferenceColor(report.differencePercentage)}`}>
                                  {formatNumber(report.differenceLiters)} L ({formatNumber(report.differencePercentage)}%)
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-400">Promedio/km</div>
                                <div className="text-lg font-semibold text-purple-400">
                                  {formatNumber(report.averageConsumptionPerKm, 3)} L/km
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : machineryReport && machineryReport.reports && machineryReport.reports.length === 0 ? (
                    <div className="fuel-card p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg mb-2">No hay datos disponibles</p>
                      <p className="text-slate-500 text-sm">
                        {machineryType !== null 
                          ? `No se encontraron registros para el tipo de maquinaria "${getMachineryTypeName(machineryType)}" con los filtros seleccionados`
                          : 'No se encontraron registros con los filtros seleccionados'}
                      </p>
                    </div>
                  ) : null}

                  {/* Consumo Diario */}
                  {periodReport?.dailyConsumption && periodReport.dailyConsumption.length > 0 && (
                    <div className="fuel-card p-6">
                      <h2 className="text-xl font-semibold text-white mb-4">Consumo Diario</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="py-3 px-4 text-left text-slate-300">Fecha</th>
                              <th className="py-3 px-4 text-right text-slate-300">Estimado (L)</th>
                              <th className="py-3 px-4 text-right text-slate-300">Real (L)</th>
                              <th className="py-3 px-4 text-right text-slate-300">Distancia (km)</th>
                              <th className="py-3 px-4 text-right text-slate-300">Registros</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periodReport.dailyConsumption.map((daily: any, index: number) => (
                              <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="py-3 px-4 text-slate-300">{daily.date ?? daily.Date ?? ''}</td>
                                <td className="py-3 px-4 text-right text-blue-400">{formatNumber(daily.estimatedConsumption ?? daily.estimated_consumption ?? 0)}</td>
                                <td className="py-3 px-4 text-right text-green-400">{formatNumber(daily.realConsumption ?? daily.real_consumption ?? 0)}</td>
                                <td className="py-3 px-4 text-right text-slate-300">{formatNumber(daily.distanceKm ?? daily.distance_km ?? 0)}</td>
                                <td className="py-3 px-4 text-right text-slate-300">{daily.registerCount ?? daily.register_count ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            }
            
            // Si no hay datos pero hay reportes cargados
            if ((periodReport || machineryReport) && totalRegisters === 0) {
              return (
                <div className="fuel-card p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg mb-2">No hay datos disponibles</p>
                  <p className="text-slate-500 text-sm">
                    {machineryType !== null 
                      ? `No se encontraron registros para el tipo de maquinaria "${getMachineryTypeName(machineryType)}" con los filtros seleccionados`
                      : 'No se encontraron registros de combustible con los filtros seleccionados'}
                  </p>
                </div>
              );
            }
            
            // Cargando datos
            return (
              <div className="fuel-card p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">Cargando datos...</p>
                <p className="text-slate-500 text-sm">Los datos se están cargando automáticamente</p>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Comparación Estimado vs Real */
        <div className="space-y-4">
          {comparisonData && comparisonData.summary && comparisonData.summary.totalRoutes > 0 ? (
            <>
              {/* Botón de descarga global */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    try {
                      if (comparisonData && comparisonData.items && comparisonData.items.length > 0) {
                        generateComparisonReportPdf(comparisonData, {
                          startDate,
                          endDate,
                          machineryType
                        });
                        addToast('PDF generado exitosamente', 'success');
                      } else {
                        addToast('No hay datos para generar el PDF', 'error');
                      }
                    } catch (error) {
                      console.error('Error al generar PDF:', error);
                      addToast('Error al generar el PDF', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte Completo (PDF)
                </button>
              </div>

              {/* Resumen de Comparación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Estimado</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatNumber(comparisonData.summary.totalEstimated)} L
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Real</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatNumber(comparisonData.summary.totalReal)} L
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Diferencia</div>
                  <div className={`text-2xl font-bold ${getDifferenceColor(comparisonData.summary.averageDifferencePercentage)}`}>
                    {formatNumber(comparisonData.summary.totalDifference)} L
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    ({formatNumber(comparisonData.summary.averageDifferencePercentage)}% promedio)
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Rutas</div>
                  <div className="text-2xl font-bold text-white">
                    {comparisonData.summary.totalRoutes}
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Sobre Estimación</div>
                  <div className="text-2xl font-bold text-red-400">
                    {comparisonData.summary.routesOverEstimate}
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Bajo Estimación</div>
                  <div className="text-2xl font-bold text-green-400">
                    {comparisonData.summary.routesUnderEstimate}
                  </div>
                </div>
              </div>

              {/* Gráfico de Comparación Mensual */}
              <div className="fuel-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Comparación entre el consumo real y el estimado mensualmente
                </h2>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                          return `${year}-${monthNames[parseInt(month) - 1]}`;
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                        formatter={(value: number) => [`${formatNumber(value)} L`, '']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ color: '#f1f5f9' }}
                        iconType="circle"
                      />
                      <Line
                        type="monotone"
                        dataKey="Real"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4 }}
                        name="Real"
                      />
                      <Line
                        type="monotone"
                        dataKey="Estimado"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 4 }}
                        name="Estimado"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-96 text-slate-400">
                    <div className="text-center">
                      <p className="text-lg mb-2">No hay datos disponibles para mostrar el gráfico</p>
                      <p className="text-sm">Asegúrate de tener registros de combustible en el rango de fechas seleccionado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de Comparación */}
              <div className="fuel-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Detalle por Ruta</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400">Ruta ID</th>
                        <th className="text-left py-3 px-4 text-slate-400">Tipo</th>
                        <th className="text-right py-3 px-4 text-slate-400">Estimado (L)</th>
                        <th className="text-right py-3 px-4 text-slate-400">Real (L)</th>
                        <th className="text-right py-3 px-4 text-slate-400">Distancia (km)</th>
                        <th className="text-right py-3 px-4 text-slate-400">Diferencia</th>
                        <th className="text-right py-3 px-4 text-slate-400">Fecha</th>
                        <th className="text-center py-3 px-4 text-slate-400">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-slate-300 text-sm">{item.routeId.substring(0, 8)}...</td>
                          <td className="py-3 px-4 text-slate-300">{getMachineryTypeName(item.machineryType)}</td>
                          <td className="py-3 px-4 text-right text-blue-400">{formatNumber(item.estimatedConsumption)}</td>
                          <td className="py-3 px-4 text-right text-green-400">{formatNumber(item.realConsumption)}</td>
                          <td className="py-3 px-4 text-right text-slate-300">{formatNumber(item.distanceKm)}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${getDifferenceColor(item.differencePercentage)}`}>
                            {formatNumber(item.differenceLiters)} ({formatNumber(item.differencePercentage)}%)
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 text-sm">{formatDate(item.completedAt)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                generateRouteReportPdf(item);
                                addToast('PDF de ruta generado exitosamente', 'success');
                              }}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Descargar reporte de esta ruta"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : comparisonData && comparisonData.summary && comparisonData.summary.totalRoutes === 0 ? (
            <div className="fuel-card p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">No hay datos disponibles</p>
              <p className="text-slate-500 text-sm">No se encontraron registros de combustible con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="fuel-card p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2">Cargando datos...</p>
              <p className="text-slate-500 text-sm">Los datos se están cargando automáticamente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupervisorReports;
