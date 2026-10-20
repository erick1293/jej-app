const esbuild = require('esbuild');
esbuild.buildSync({ entryPoints: ['scripts/capacitor-plugins-entry.js'], bundle: true, format: 'iife', platform: 'browser', target: ['es2020'], outfile: 'js/capacitor-plugins.js' });
esbuild.buildSync({ entryPoints: ['scripts/msal-entry.js'], bundle: true, format: 'iife', platform: 'browser', target: ['es2020'], outfile: 'js/msal-browser.js' });
console.log('Plugins Capacitor y MSAL empaquetados para uso offline.');
