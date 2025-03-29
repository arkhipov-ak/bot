import React, { useEffect } from 'react'
import Game from './components/Game';

declare global {
	interface Window {
		ym: any
		Telegram: any
		dataLayer: any
	}
}


function App() {
  useEffect(() => {
  	const tg = window.Telegram.WebApp
    if (!tg) return
    tg.disableVerticalSwipes()
    // tg?.requestFullscreen()
    tg.expand()
    tg.ready()
    
  }, [])
  
  return <Game />;
}

export default App;
