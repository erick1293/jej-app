const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'www');
const entries = ['index.html', 'css', 'img', 'js', 'pages', 'plantillas'];
fs.mkdirSync(webDir, { recursive: true });
for (const entry of entries) {
  const source = path.join(root, entry);
  const target = path.join(webDir, entry);
  if (!fs.existsSync(source)) throw new Error('No existe el recurso requerido: ' + entry);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}
console.log('Recursos web copiados a www.');
