import React from 'react';
import Game from './components/Game';

declare global {
	interface Window {
		ym: any;
		Telegram: any;
		dataLayer: any;
	}
}

class App extends React.Component {
	componentDidMount() {
		try {
			const tg = window.Telegram?.WebApp;
			if (!tg) return;
			tg.disableVerticalSwipes();
			tg.requestFullscreen();
			tg.lockOrientation();
			tg.expand();
			tg.ready?.();
		} catch (err) {
			console.log(err);
		}
	}

	render() {
		return <Game />;
	}
}

export default App;
