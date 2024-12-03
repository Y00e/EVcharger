import './App.css'
import Baseload from './components/Baseload';
import PricePerHour from './components/PricePerHour';
import SimulationData from './components/SimulationData';


function App() {

  return (
    <>
      <SimulationData />
      <Baseload />
      <PricePerHour />
    </>
  )
}

export default App
