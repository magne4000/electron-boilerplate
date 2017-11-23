// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

const cp = require('child_process');
var fs = require('fs');
var tar = require('tar');
var zlib = require('zlib');
var mkdirp = require('mkdirp');

const setApplicationMenu = () => {
  const menus = [editMenuTemplate];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }


  const CWD = '/tmp/test-npm';
  const PACKAGE = 'levelup';
  const child = cp.fork(require.resolve('npm/bin/npm-cli'), ['pack', PACKAGE], {
    cwd: CWD,
    execArgv: [],
    silent: true
  });

  child.stdout.on('data', (data) => {
    const filename = path.join(CWD, data.toString().trim());
    const extractdir = path.join(CWD, PACKAGE);
    mkdirp(extractdir, e => {
      if (e) return console.error(e);
      fs.createReadStream(filename)
        .on('error', console.error)
        .pipe(zlib.Unzip())
        .pipe(new tar.Unpack({ cwd: extractdir, strip: 1 }))
        .on("end", () => {
          fs.unlink(filename, e2 => {
            if (e2) return console.error(e2);
            const c2 = cp.fork(require.resolve('npm/bin/npm-cli'), ['install', '--no-save', '--no-package-lock', '--production'], {
              cwd: extractdir,
              execArgv: []
            });

            c2.on('close', () => {
              console.log('requiring', extractdir);
              const mylib = require(extractdir);
              console.log('required', mylib);
            })
          })
        });
    });
  });
});

app.on('window-all-closed', () => {
  app.quit();
});


