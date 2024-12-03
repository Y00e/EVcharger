import {useState, useEffect} from "react";
import axios from "axios";
function Baseload() {
  const [loadData, setLoadData] = useState(null);

  // useEffect hämtar baseload data med axios och uppdaterar state
  useEffect(() => {
    axios.get('http://127.0.0.1:5000/baseload')
     .then(response => {
       setLoadData(response.data);
     })
     .catch(error => {
       console.error('Error fetching baseload data', error);
     });
  }, []);
  
  // Om baseload data inte har hämtats än, visar vi ett laddningsindikator
  if (!loadData) {
    return <div>Loading</div>;
  }

  // Visar baseload data i en lista
  return (
    <div>
      <h1>Baseload Data</h1>
      <ul>
        {loadData.map((load, index ) =>
        <li key={index}>Hour {index}: {load} kWh </li> 
         )}
      </ul>
    </div>
  )
};

export default Baseload;

