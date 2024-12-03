import React, { useState, useEffect } from 'react';
import axios from 'axios';
function SimulationData() {
  const [data, setData] = useState(null);
  const cheapestHours = [22, 23, 2, 3]; // billigast timmar för laddning och där hushållets energiförbrykning inte överstiger 11 kWh

  const fetchData = () => {
    axios.get('http://127.0.0.1:5000/info')
     .then(response => {
      setData(response.data);
     })
     .catch(error => {
      console.error('Error fetching data', error);
     });
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

  // Automatisk, start/stop laddning  
  useEffect(() => {
    if (data) {
      const currentHour = data.sim_time_hour;
      const maxChargeLevel = 0.8 * 46.3; // Laddar upp till max 80% av full kapacitet (37.04 kWh)
      
      // kollar om den nuvarande timmen är en av dom billigare timmarna
      const isInCheapestHours = cheapestHours.includes(currentHour);

      // kollar om den ska ladda eller inte ladda beronde på laddning nivån och om den är inom billigast timme.
      if (data.battery_capacity_kWh < maxChargeLevel && isInCheapestHours) {
        if (!data.ev_battery_charge_start_stopp) {
          handleCharging(true); // Start laddning
        }
      } else {
        if (data.ev_battery_charge_start_stopp) {
          handleCharging(false); // Stop laddning
        }
      }
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
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