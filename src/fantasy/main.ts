import '../ui/styles.css';
import './styles.css';
import { startBrowserGame } from '../browser/runtime';
import { createHollowmere } from './definition';
import { mountFantasy } from './app';
startBrowserGame({
  namespace: 'hollowmere',
  debugName: '__hollowmere',
  createDefinition: createHollowmere,
  mount: mountFantasy,
});
