import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, TrendingUp, Fuel, Calendar, Filter, Download, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../api/api';
import { useToast } from '../../shared/ToastNotification';

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

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'machinery' | 'comparison'>('machinery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [machineryType, setMachineryType] = useState<number | null>(null);

  // Datos de reportes
  const [machineryReport, setMachineryReport] = useState<ReportByMachineryTypeResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<ConsumptionComparisonResponse | null>(null);

  // Cargar reporte por tipo de maquinaria
  const fetchMachineryReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (machineryType !== null) params.append('machinery_type', machineryType.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api<ReportByMachineryTypeResponse>(
        `/fuel/reports/machinery-type?${params.toString()}`
      );
      setMachineryReport(response);
    } catch (err: any) {
      console.error('Error fetching machinery report:', err);
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
      if (machineryType !== null) params.append('machinery_type', machineryType.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api<any>(
        `/fuel/reports/consumption-comparison?${params.toString()}`
      );
      
      // Transformar snake_case a camelCase si es necesario
      const transformedResponse: ConsumptionComparisonResponse = {
        items: (response.items || []).map((item: any) => ({
          routeId: item.route_id || item.routeId,
          machineryType: item.machinery_type ?? item.machineryType ?? 0,
          estimatedConsumption: item.estimated_consumption ?? item.estimatedConsumption ?? 0,
          realConsumption: item.real_consumption ?? item.realConsumption ?? 0,
          distanceKm: item.distance_km ?? item.distanceKm ?? 0,
          differenceLiters: item.difference_liters ?? item.differenceLiters ?? 0,
          differencePercentage: item.difference_percentage ?? item.differencePercentage ?? 0,
          completedAt: item.completed_at || item.completedAt || new Date().toISOString(),
        })),
        summary: {
          totalEstimated: response.summary?.total_estimated ?? response.summary?.totalEstimated ?? 0,
          totalReal: response.summary?.total_real ?? response.summary?.totalReal ?? 0,
          totalDifference: response.summary?.total_difference ?? response.summary?.totalDifference ?? 0,
          averageDifferencePercentage: response.summary?.average_difference_percentage ?? response.summary?.averageDifferencePercentage ?? 0,
          totalRoutes: response.summary?.total_routes ?? response.summary?.totalRoutes ?? 0,
          routesOverEstimate: response.summary?.routes_over_estimate ?? response.summary?.routesOverEstimate ?? 0,
          routesUnderEstimate: response.summary?.routes_under_estimate ?? response.summary?.routesUnderEstimate ?? 0,
        }
      };
      
      console.log('Comparison data received:', transformedResponse);
      setComparisonData(transformedResponse);
    } catch (err: any) {
      console.error('Error fetching comparison report:', err);
      setError(err.message || 'Error al cargar el reporte');
      addToast('Error al cargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia el tab o se aplican filtros
  useEffect(() => {
    if (activeTab === 'machinery') {
      fetchMachineryReport();
    } else {
      fetchComparisonReport();
    }
  }, [activeTab, startDate, endDate, machineryType]);

  const formatNumber = (num: number, decimals: number = 2) => {
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

  const handleApplyFilters = () => {
    if (activeTab === 'machinery') {
      fetchMachineryReport();
    } else {
      fetchComparisonReport();
    }
  };

  // Agrupar datos por mes para el gráfico
  const monthlyData = useMemo(() => {
    if (!comparisonData || !comparisonData.items || comparisonData.items.length === 0) {
      console.log('No comparison data available for chart');
      return [];
    }

    console.log('Processing items for chart:', comparisonData.items.length);

    // Agrupar por mes
    const monthlyMap = new Map<string, { real: number; estimado: number }>();

    comparisonData.items.forEach((item, index) => {
      try {
        const date = new Date(item.completedAt);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date at index ${index}:`, item.completedAt);
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
        console.error(`Error processing item at index ${index}:`, err, item);
      }
    });

    // Convertir a array y ordenar por fecha
    const data = Array.from(monthlyMap.entries())
      .map(([key, values]) => ({
        month: key,
        Real: Math.round(values.real * 100) / 100,
        Estimado: Math.round(values.estimado * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log('Monthly data for chart:', data);
    return data;
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Reportes de Combustible
          </h1>
          <p className="text-slate-400">Análisis de consumo y rendimiento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('machinery')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'machinery'
              ? 'text-red-400 border-b-2 border-red-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Por Tipo de Maquinaria
          </div>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'text-red-400 border-b-2 border-red-400'
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
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Maquinaria</label>
            <select
              value={machineryType === null ? '' : machineryType}
              onChange={(e) => setMachineryType(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos</option>
              <option value="0">Liviano</option>
              <option value="1">Pesado</option>
            </select>
          </div>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Contenido de Reportes */}
      {loading ? (
        <div className="fuel-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando reporte...</p>
        </div>
      ) : error ? (
        <div className="fuel-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : activeTab === 'machinery' ? (
        /* Reporte por Tipo de Maquinaria */
        <div className="space-y-4">
          {machineryReport && (
            <>
              {/* Resumen General */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Estimado</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatNumber(machineryReport.totalEstimatedConsumption)} L
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Real</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatNumber(machineryReport.totalRealConsumption)} L
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Distancia Total</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatNumber(machineryReport.totalDistanceKm)} km
                  </div>
                </div>
                <div className="fuel-card p-4">
                  <div className="text-sm text-slate-400 mb-1">Total Registros</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {machineryReport.totalRegisters}
                  </div>
                </div>
              </div>

              {/* Reportes por Tipo */}
              <div className="fuel-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Desglose por Tipo de Maquinaria</h2>
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
            </>
          )}
        </div>
      ) : (
        /* Comparación Estimado vs Real */
        <div className="space-y-4">
          {comparisonData && (
            <>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;

