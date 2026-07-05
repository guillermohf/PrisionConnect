const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\Guillermo Herrera\\OneDrive\\Desktop\\WorkSpace\\prisionconnect\\public\\assets\\data';
const barrios = JSON.parse(fs.readFileSync(path.join(base, 'barrios.json'), 'utf8'));
const sectores = JSON.parse(fs.readFileSync(path.join(base, 'sectores.json'), 'utf8'));
const municipios = JSON.parse(fs.readFileSync(path.join(base, 'municipios.json'), 'utf8'));

const names = ['Naco', 'Gazcue', 'Bella Vista', 'Arroyo Hondo'];

names.forEach(name => {
  const matchedBarrios = barrios.filter(b => b.nombre.includes(name));
  console.log(`\n--- Barrio matching "${name}" (found ${matchedBarrios.length}) ---`);
  matchedBarrios.slice(0, 5).forEach(b => {
    const sec = sectores.find(s => s.id === b.seccionId);
    const mun = sec ? municipios[sec.municipioId - 1] : null;
    console.log(`Barrio: "${b.nombre}", seccionId: ${b.seccionId}, Sector: "${sec ? sec.nombre : 'Unknown'}", Municipio: "${mun ? mun.nombre : 'Unknown'}" (provinciaId: ${mun ? mun.provinciaId : '?'})`);
  });
});
