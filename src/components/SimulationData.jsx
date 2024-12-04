import React, { useState, useEffect } from 'react';
import axios from 'axios';
function SimulationData() {
  const [data, setData] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [cheapestHours, setCheapestHours] = useState([]); // billigast timmar för laddning 
  const [baseloadData, setBaseloadData] = useState([]);
  const [baseloadHoursUnder11kWh, setBaseloadHoursUnder11kWh] = useState([]);// hushållets energiförbrykning inte överstiger 11 kWh

  const fetchData = () => {
    axios.get('http://127.0.0.1:5000/info')
     .then(response => {
      setData(response.data);
     })
     .catch(error => {
      console.error('Error fetching data', error);
     });
  };

  const fetchPricePerHour = () => {
    axios.get('http://127.0.0.1:5000/priceperhour')
      .then(response => {
        setPriceData(response.data);
      })
      .catch(error => {
        console.error('Error fetching price data', error);
      });
  };

  const fetchBaseload = () => {
    axios.get('http://127.0.0.1:5000/baseload')
      .then(response => {
        setBaseloadData(response.data);
      })
      .catch(error => {
        console.error('Error fetching price data', error);
      });
  };

  // räknar den biligast timme från pris data
  const calculateCheapestHours = (prices) => {
    if (prices.length === 0) return;

    const cheapest = prices
      .map((price, index) => ({ hour: index, price }))
      .sort((a, b) => a.price - b.price) // Sortea priset
      .slice(0, 4) // hämtar 4 billigast pris
      .map(item => item.hour);

    setCheapestHours(cheapest);
  };

  // checkar så att inte baseload överstiger 11 kWh per hour
  const getBaseloadHoursUnder11kWh = (baseloads) => {
    if (baseloads.length === 0) return;
  
    const filteredBaseloads = baseloads
      .map((load, index) => ({ hour: index, load }))
      .filter(item => item.load < 11) // plockar ut dom värdena för load som är mindre än 11 kWh
      .map(item => item.hour); // skapar ny array för load
  
      setBaseloadHoursUnder11kWh(filteredBaseloads);
  };

  
  const handleCharging = (startCharging) => {
    axios.post('http://127.0.0.1:5000/charge', {charging: startCharging ? 'on' : 'off'})
     .then(response => {
      console.log('Charging status updated', response.data);
     })
     .catch(error => {
      console.error('Error updating charging status', error);
     });
  };

  const handleReset = () => {
    axios.post('http://127.0.0.1:5000/discharge', {discharging: 'on'})
      .then(response => {
        console.log('Discharging status updated:', response.data);
        fetchData();
      })
      .catch(error => {
        console.error('Error updating discharging status:', error);
      });
  };

  useEffect(() => {
    calculateCheapestHours(priceData, baseloadData);
    getBaseloadHoursUnder11kWh(baseloadData);
  }, [priceData, baseloadData]);

  // Automatisk, start/stop laddning  
  useEffect(() => {
    if (data && cheapestHours.length > 0 ) {
      const currentHour = data.sim_time_hour;
      const maxChargeLevel = 0.8 * 46.3; // Laddar upp till max 80% av full kapacitet (37.04 kWh)
      
      // kollar om den nuvarande timmen är en av dom billigare timmarna och med läggst baseload
      const isInCheapestHours = cheapestHours.includes(currentHour);
      const isInLowestBaseloadHours = baseloadHoursUnder11kWh.includes(currentHour);

      // kollar om den ska ladda eller inte ladda beronde på laddning nivån och om den är inom billigast timme.
      if (data.battery_capacity_kWh < maxChargeLevel && isInCheapestHours && isInLowestBaseloadHours) {
        if (!data.ev_battery_charge_start_stopp) {
          handleCharging(true); // Start laddning
        }
      } else {
        if (data.ev_battery_charge_start_stopp) {
          handleCharging(false); // Stop laddning
        }
      }
    }
  }, [data, cheapestHours, baseloadHoursUnder11kWh]);

  useEffect(() => {
    fetchData();
    fetchPricePerHour();
    fetchBaseload();
    const interval = setInterval(() => {
      fetchData();
      fetchPricePerHour();
      fetchBaseload();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!data || cheapestHours.length === 0 || baseloadHoursUnder11kWh.length === 0) {
    return <div>Loading</div>;
  }

  return (
    <div>
      <h1>EV Charging Simulation Data</h1>
        <p>Sim Time Hour: {data.sim_time_hour}</p>
        <p>Sim Time Min: {data.sim_time_min}</p>
        <p>Base Current Load: {data.base_current_load}</p>
        <p>Battery Capacity kWh: {data.battery_capacity_kWh}</p>
        {/* toFixed 2 innebär att det är avrundat till 2 decimaler */}
        <p>Battery Capacity Percent: {((data.battery_capacity_kWh / 46.3) * 100).toFixed(2)}%</p>
        <p>EV Battery Charge: {data.ev_battery_charge_start_stopp ? 'on' : 'off'}</p>
        <div>
          <button onClick={handleReset}>Reset</button>
        </div>
    </div>
  );
};

export default SimulationData;