import {detect} from './lib/detect';
import log from 'why-is-node-running';

console.log("Starting...");
(async () => {
    await detect();
    log();
    //process.exit()
})();
