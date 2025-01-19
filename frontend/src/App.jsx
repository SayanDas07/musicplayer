import { useEffect } from "react"
import { useState } from "react"

import Login from "./components/Login";
import SpotifyPlayer from "./components/Spotify1";


function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(token);
    if (token) {
      setToken(token);
    }
  }, [])


  
  return (
    <>
      
      {token ? <SpotifyPlayer /> : <Login />}

      
      


    </>
  )
}

export default App
