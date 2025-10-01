import React, { useEffect } from 'react';
import API from '../api/api'; 

const DataLogger = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cambia '/endpoint' por la ruta que deseas consultar en tu API
        const response = await API.get('/chofer/hello');
        console.log('Datos recibidos de la API:', response.data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Revisa la consola para ver los datos de la API</h2>
    </div>
  );
};

export default DataLogger;
