import React, { useState, useEffect } from 'react';
import axios from 'axios';
function SimulationData() {
  const [data, setData] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [cheapestHours, setCheapestHours] = useState([]); // läsar aktuella värdet och uppdatera, billigast timmar för laddning 
  const [baseloadData, setBaseloadData] = useState([]);
  const [baseloadHoursUnder11kWh, setBaseloadHoursUnder11kWh] = useState([]);// hushållets energiförbrykning inte överstiger 11 kWh
  const [lowestBaseloadHours, setLowestBaseloadHours] = useState([]);
  const [chargingMode, setChargingMode] = useState('price');

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

  // sorterar och skapar en arraay med dom 4 billigast timmarna från pris data
  const calculateCheapestHours = (prices) => {
    if (prices.length === 0) return;

    const cheapest = prices
      .map((price, index) => ({ hour: index, price }))
      .sort((a, b) => a.price - b.price) // Sortea priset
      .slice(0, 4) // hämtar 4 billigast pris
      .map(item => item.hour);

    setCheapestHours(cheapest);
  };

  // hämtar baseload hours som är under 3.5 kWh
  const getBaseloadHoursUnder11kWh = (baseloads) => {
    if (baseloads.length === 0) return;
  
    const filteredBaseloads = baseloads
      .map((load, index) => ({ hour: index, load }))
      .filter(item => item.load < 3.5) // plockar ut dom värdena för load som är mindre än 11 kWh
      .map(item => item.hour); // skapar ny array för load
  
      setBaseloadHoursUnder11kWh(filteredBaseloads);
  };

  // sorterar och skapar en arraay med dom 4 läggsta baseload timmarna
  const calculateLowestBaseloadHours = (baseloads) => {
    if (baseloads.length === 0) return;

    const lowest = baseloads
      .map((load, index) => ({ hour: index, load }))
      .sort((a, b) => a.load - b.load) // Sorterar baseload 
      .slice(0, 4) // hämtar dom 4 timmar med läggst energi förbrukning
      .map(item => item.hour);

    setLowestBaseloadHours(lowest);
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

  const handleChargingMode = (mode) => {
    setChargingMode(mode);
  };
  
  useEffect(() => {
    calculateCheapestHours(priceData, baseloadData);
    getBaseloadHoursUnder11kWh(baseloadData);
    calculateLowestBaseloadHours(baseloadData);
  }, [priceData, baseloadData]);

  // Automatisk, start/stop laddning  
  useEffect(() => {
    if (data) {
      const currentHour = data.sim_time_hour;
      const maxChargeLevel = 0.8 * 46.3; // Laddar upp till max 80% av full kapacitet (37.04 kWh)
      
      // kollar om den nuvarande timmen är en av dom billigare timmarna och med läggst baseload
      const isInCheapestHours = cheapestHours.includes(currentHour);
      const isUnder11kWh = baseloadHoursUnder11kWh.includes(currentHour);
      const isInLowestBaseloadHours = lowestBaseloadHours.includes(currentHour);

      // kollar om den ska ladda eller inte ladda beronde på laddning nivån och om den är inom billigast timme.
      if (chargingMode === 'price' && data.battery_capacity_kWh < maxChargeLevel && isInCheapestHours && isUnder11kWh) {
        if (!data.ev_battery_charge_start_stopp) {
          handleCharging(true); // Start laddning
        }
      } else if (chargingMode === 'baseload' && data.battery_capacity_kWh < maxChargeLevel && isInLowestBaseloadHours) {
        if (!data.ev_battery_charge_start_stopp) {
          handleCharging(true); // Stop laddning
        }
      } else {
        if (data.ev_battery_charge_start_stopp) {
          handleCharging(false);
        }
      }
    }
  }, [data, cheapestHours, baseloadHoursUnder11kWh, lowestBaseloadHours, chargingMode]);

  useEffect(() => {
    fetchData();
    fetchPricePerHour();
    fetchBaseload();
    const interval = setInterval(() => {
      fetchData();
      fetchPricePerHour();
      fetchBaseload();
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!data || cheapestHours.length === 0 || baseloadHoursUnder11kWh.length === 0||
    lowestBaseloadHours.length === 0) {
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
        <div>
          <button onClick={() => handleChargingMode('price')}>Charge in lowest price</button>
          <button onClick={() => handleChargingMode('baseload')}>Charge in lowest baseload</button>
        </div>
        <div>
          <h2>Lowest baseload hours</h2>
        <ul>
          {lowestBaseloadHours.map(hour => (
            <li key={hour}>Hour: {hour}</li>
          ))}
        </ul>
        <div>
        <h2>Lowest price hours:</h2>
        <ul>
          {cheapestHours.map(hour => (
            <li key={hour}>Hour: {hour}</li>
          ))}
        </ul>
      </div>
        </div>
    </div>
  );
};

export default SimulationData;