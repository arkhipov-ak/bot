import React, { useEffect } from 'react'
import Game from './components/Game';

function App() {
  useEffect(() => {
    // @ts-ignore
  	const tg = window.Telegram.WebApp
    if (!tg) return
    tg.disableVerticalSwipes()
    //tg?.requestFullscreen()
    tg.expand()
    tg.ready()
    
  }, [])
  
  return <Game />;
}

export default App;
