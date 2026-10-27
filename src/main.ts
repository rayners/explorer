import './ui/styles.css';
import { startBrowserGame } from './browser/runtime';
import { createGame } from './game/definition';
import { mountApp } from './ui/app';
startBrowserGame({
  namespace: 'far-wake',
  debugName: '__farWake',
  createDefinition: createGame,
  mount: mountApp,
});
