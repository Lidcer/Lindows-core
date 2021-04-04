# What is Lindows
Lindows is fictitious operation system designed to run in modern web browsers.\
It has plan where you would be able to install and run custom apps on your own.\
Entire frontend structure uses extended React Library meaning coding lidnows apps should be very easy to do.\
Each window's css is encapsulated with library styled-component meaning that css is not shared shared between then in any way. \
 
## Built-in Apps
This is core version of entire system it only has few apps

Terminal - You can execute command with it. (WIP)\
Task Manager - get all info about open windows (WIP)\



## System services
Processor service is responsible for displaying windows doing action like focus, closing then and so on.\
broadcaster service is service that handles communicating between browser tabs. The entire operation system is light wight making this thing possible.\
FingerPriner service is service which tells you all information about your system.\
Network service is service that connects you to the server websocket. \

## background services
Notification service is service that shows you notifications like form lype\

### How to develope a simple window app
```js
import React from 'react';
import { IManifest, BaseWindow, MessageBox } from '../BaseWindow/BaseWindow';


export class AnApp extends BaseWindow {
  public static manifest: IManifest = {
    fullAppName: 'An app',
    launchName: 'anapp',
    icon: '/assets/images/unknown-app.svg',
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 300,
        minWidth: 300,
      },
    );
  }

  renderInside() {
    return (
      <div>
        <h1>Hello World</h1>
      </div>
    );
  }
}
```

checkout `..src\client\apps\AnApp\AnApp.tsx` for full example

## How to run?

```bash
npm install
npm run dev
```

### Usage

- `npm run dev` - Client and server are in watch mode with source maps, opens [http://localhost:5050](http://localhost:5050)
- `npm run test` - Runs jest tests
- `npm run lint` - Runs es-lint
- `npm run build` - `dist` folder will include all the needed files, both client (Bundle) and server.
- `npm start` - Just runs `node ./dist/server/server.js`
- `npm start:prod` - sets `NODE_ENV` to `production` and then runs `node ./dist/server/server.js`. (Bypassing webpack proxy)
