const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\Guillermo Herrera\\OneDrive\\Desktop\\WorkSpace\\prisionconnect\\public\\assets\\data';
const sectores = JSON.parse(fs.readFileSync(path.join(base, 'sectores.json'), 'utf8'));
const municipios = JSON.parse(fs.readFileSync(path.join(base, 'municipios.json'), 'utf8'));

// Find sectors with "Naco" or "Gazcue" or "Hondo"
const sampleSectores = sectores.filter(s => s.nombre.includes('Naco') || s.nombre.includes('Gazcue') || s.nombre.includes('Arroyo Hondo'));
console.log('Sample sectors found:', sampleSectores.length);
sampleSectores.forEach(s => {
  const mun = municipios[s.municipioId - 1];
  console.log(`Sector: "${s.nombre}", municipioId: ${s.municipioId}, Municipio: "${mun ? mun.nombre : 'Unknown'}" (provinciaId: ${mun ? mun.provinciaId : '?'})`);
});
