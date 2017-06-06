// Here is the starting point for your application code.

// Small helpers you might want to keep
import './helpers/context_menu.js';
import './helpers/external_links.js';

// All stuff below is just to show you how it works. You can delete all of it.
import electron from 'electron';

const webview = document.querySelector('webview');
webview.addEventListener('did-attach', function(e) {
  electron.ipcRenderer.send('guestinstance', webview.guestinstance);
}, false);

webview.addEventListener('destroyed', function(e) {
  console.log('webview destroyed', e);
}, false);
