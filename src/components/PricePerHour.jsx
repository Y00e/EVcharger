import { useState, useEffect } from "react";
import axios from "axios";
function PricePerHour() {
  const [priceData, setPriceData] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/priceperhour')
     .then(response => {
      setPriceData(response.data);
     })
     .catch(error => {
      console.error('Error fetching price data', error);
     });
  }, []);

  if (!priceData) {
    return <div>Loading</div>;
  }

  return (
    <div>
      <h1>Price per Hour</h1>
      <ul>
          {priceData.map((price, index) => (
            <li key={index}>Hour {index}: {price} ÖRE</li>
          ))}
      </ul>
    </div>
  )

};

export default PricePerHour;