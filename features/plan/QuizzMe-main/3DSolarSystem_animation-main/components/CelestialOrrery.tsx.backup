import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// CELESTIAL ORRERY + PLANETARIUM
// Sonnensystem-Visualisierung mit Zoom zum persönlichen Geburtshimmel
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// STAR CATALOG — Die 150 hellsten Sterne mit J2000.0 Koordinaten
// ─────────────────────────────────────────────────────────────────────────────

const STARS = [
  // Orion
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, mag: 0.42, con: 'Orion' },
  { name: 'Rigel', ra: 5.242, dec: -8.202, mag: 0.13, con: 'Orion' },
  { name: 'Bellatrix', ra: 5.419, dec: 6.350, mag: 1.64, con: 'Orion' },
  { name: 'Mintaka', ra: 5.533, dec: -0.299, mag: 2.23, con: 'Orion' },
  { name: 'Alnilam', ra: 5.603, dec: -1.202, mag: 1.69, con: 'Orion' },
  { name: 'Alnitak', ra: 5.679, dec: -1.943, mag: 1.77, con: 'Orion' },
  { name: 'Saiph', ra: 5.796, dec: -9.670, mag: 2.06, con: 'Orion' },
  // Ursa Major
  { name: 'Dubhe', ra: 11.062, dec: 61.751, mag: 1.79, con: 'UrsaMajor' },
  { name: 'Merak', ra: 11.031, dec: 56.382, mag: 2.37, con: 'UrsaMajor' },
  { name: 'Phecda', ra: 11.897, dec: 53.695, mag: 2.44, con: 'UrsaMajor' },
  { name: 'Megrez', ra: 12.257, dec: 57.033, mag: 3.31, con: 'UrsaMajor' },
  { name: 'Alioth', ra: 12.900, dec: 55.960, mag: 1.77, con: 'UrsaMajor' },
  { name: 'Mizar', ra: 13.399, dec: 54.925, mag: 2.27, con: 'UrsaMajor' },
  { name: 'Alkaid', ra: 13.792, dec: 49.313, mag: 1.86, con: 'UrsaMajor' },
  // Ursa Minor
  { name: 'Polaris', ra: 2.530, dec: 89.264, mag: 2.02, con: 'UrsaMinor' },
  { name: 'Kochab', ra: 14.845, dec: 74.156, mag: 2.08, con: 'UrsaMinor' },
  { name: 'Pherkad', ra: 15.345, dec: 71.834, mag: 3.05, con: 'UrsaMinor' },
  // Cassiopeia
  { name: 'Schedar', ra: 0.675, dec: 56.537, mag: 2.23, con: 'Cassiopeia' },
  { name: 'Caph', ra: 0.153, dec: 59.150, mag: 2.27, con: 'Cassiopeia' },
  { name: 'Gamma Cas', ra: 0.945, dec: 60.717, mag: 2.47, con: 'Cassiopeia' },
  { name: 'Ruchbah', ra: 1.430, dec: 60.235, mag: 2.68, con: 'Cassiopeia' },
  { name: 'Segin', ra: 1.907, dec: 63.670, mag: 3.38, con: 'Cassiopeia' },
  // Scorpius
  { name: 'Antares', ra: 16.490, dec: -26.432, mag: 0.96, con: 'Scorpius' },
  { name: 'Shaula', ra: 17.560, dec: -37.104, mag: 1.63, con: 'Scorpius' },
  { name: 'Sargas', ra: 17.622, dec: -42.998, mag: 1.87, con: 'Scorpius' },
  { name: 'Dschubba', ra: 16.006, dec: -22.622, mag: 2.32, con: 'Scorpius' },
  { name: 'Graffias', ra: 16.091, dec: -19.806, mag: 2.64, con: 'Scorpius' },
  { name: 'Lesath', ra: 17.530, dec: -37.296, mag: 2.69, con: 'Scorpius' },
  // Leo
  { name: 'Regulus', ra: 10.140, dec: 11.967, mag: 1.35, con: 'Leo' },
  { name: 'Denebola', ra: 11.818, dec: 14.572, mag: 2.14, con: 'Leo' },
  { name: 'Algieba', ra: 10.333, dec: 19.842, mag: 2.28, con: 'Leo' },
  { name: 'Zosma', ra: 11.235, dec: 20.524, mag: 2.56, con: 'Leo' },
  { name: 'Ras Elased', ra: 9.764, dec: 23.774, mag: 2.98, con: 'Leo' },
  // Taurus
  { name: 'Aldebaran', ra: 4.599, dec: 16.509, mag: 0.85, con: 'Taurus' },
  { name: 'Elnath', ra: 5.438, dec: 28.608, mag: 1.65, con: 'Taurus' },
  { name: 'Alcyone', ra: 3.791, dec: 24.105, mag: 2.87, con: 'Taurus' },
  // Gemini
  { name: 'Pollux', ra: 7.755, dec: 28.026, mag: 1.14, con: 'Gemini' },
  { name: 'Castor', ra: 7.577, dec: 31.889, mag: 1.58, con: 'Gemini' },
  { name: 'Alhena', ra: 6.629, dec: 16.399, mag: 1.93, con: 'Gemini' },
  { name: 'Tejat', ra: 6.383, dec: 22.514, mag: 2.88, con: 'Gemini' },
  // Virgo
  { name: 'Spica', ra: 13.420, dec: -11.161, mag: 0.97, con: 'Virgo' },
  { name: 'Porrima', ra: 12.694, dec: -1.449, mag: 2.74, con: 'Virgo' },
  { name: 'Vindemiatrix', ra: 13.036, dec: 10.959, mag: 2.83, con: 'Virgo' },
  // Canis Major
  { name: 'Sirius', ra: 6.752, dec: -16.716, mag: -1.46, con: 'CanisMajor' },
  { name: 'Adhara', ra: 6.977, dec: -28.972, mag: 1.50, con: 'CanisMajor' },
  { name: 'Wezen', ra: 7.140, dec: -26.393, mag: 1.84, con: 'CanisMajor' },
  { name: 'Mirzam', ra: 6.378, dec: -17.956, mag: 1.98, con: 'CanisMajor' },
  // Canis Minor
  { name: 'Procyon', ra: 7.655, dec: 5.225, mag: 0.34, con: 'CanisMinor' },
  // Lyra
  { name: 'Vega', ra: 18.616, dec: 38.784, mag: 0.03, con: 'Lyra' },
  { name: 'Sheliak', ra: 18.835, dec: 33.363, mag: 3.52, con: 'Lyra' },
  { name: 'Sulafat', ra: 18.982, dec: 32.690, mag: 3.24, con: 'Lyra' },
  // Cygnus
  { name: 'Deneb', ra: 20.690, dec: 45.280, mag: 1.25, con: 'Cygnus' },
  { name: 'Sadr', ra: 20.370, dec: 40.257, mag: 2.20, con: 'Cygnus' },
  { name: 'Gienah', ra: 20.770, dec: 33.970, mag: 2.46, con: 'Cygnus' },
  { name: 'Albireo', ra: 19.512, dec: 27.960, mag: 3.18, con: 'Cygnus' },
  // Aquila
  { name: 'Altair', ra: 19.846, dec: 8.868, mag: 0.77, con: 'Aquila' },
  { name: 'Tarazed', ra: 19.771, dec: 10.614, mag: 2.72, con: 'Aquila' },
  // Sagittarius
  { name: 'Kaus Australis', ra: 18.403, dec: -34.385, mag: 1.85, con: 'Sagittarius' },
  { name: 'Nunki', ra: 18.921, dec: -26.297, mag: 2.02, con: 'Sagittarius' },
  { name: 'Ascella', ra: 19.043, dec: -29.880, mag: 2.59, con: 'Sagittarius' },
  { name: 'Kaus Media', ra: 18.350, dec: -29.828, mag: 2.70, con: 'Sagittarius' },
  { name: 'Kaus Borealis', ra: 18.466, dec: -25.422, mag: 2.81, con: 'Sagittarius' },
  // Capricornus
  { name: 'Deneb Algedi', ra: 21.784, dec: -16.127, mag: 2.87, con: 'Capricornus' },
  { name: 'Dabih', ra: 20.350, dec: -14.781, mag: 3.08, con: 'Capricornus' },
  // Aquarius
  { name: 'Sadalsuud', ra: 21.526, dec: -5.571, mag: 2.91, con: 'Aquarius' },
  { name: 'Sadalmelik', ra: 22.096, dec: -0.320, mag: 2.96, con: 'Aquarius' },
  // Pisces
  { name: 'Eta Piscium', ra: 1.525, dec: 15.346, mag: 3.62, con: 'Pisces' },
  // Aries
  { name: 'Hamal', ra: 2.120, dec: 23.463, mag: 2.00, con: 'Aries' },
  { name: 'Sheratan', ra: 1.911, dec: 20.808, mag: 2.64, con: 'Aries' },
  // Cancer
  { name: 'Acubens', ra: 8.975, dec: 11.858, mag: 4.25, con: 'Cancer' },
  { name: 'Asellus Australis', ra: 8.745, dec: 18.154, mag: 3.94, con: 'Cancer' },
  // Libra
  { name: 'Zubeneschamali', ra: 15.283, dec: -9.383, mag: 2.61, con: 'Libra' },
  { name: 'Zubenelgenubi', ra: 14.848, dec: -16.042, mag: 2.75, con: 'Libra' },
  // Crux
  { name: 'Acrux', ra: 12.443, dec: -63.099, mag: 0.76, con: 'Crux' },
  { name: 'Mimosa', ra: 12.795, dec: -59.689, mag: 1.30, con: 'Crux' },
  { name: 'Gacrux', ra: 12.519, dec: -57.113, mag: 1.64, con: 'Crux' },
  // Centaurus
  { name: 'Alpha Centauri', ra: 14.660, dec: -60.835, mag: -0.27, con: 'Centaurus' },
  { name: 'Hadar', ra: 14.064, dec: -60.373, mag: 0.61, con: 'Centaurus' },
  // Bootes
  { name: 'Arcturus', ra: 14.261, dec: 19.182, mag: -0.05, con: 'Bootes' },
  { name: 'Izar', ra: 14.750, dec: 27.074, mag: 2.70, con: 'Bootes' },
  // Pegasus
  { name: 'Enif', ra: 21.736, dec: 9.875, mag: 2.39, con: 'Pegasus' },
  { name: 'Scheat', ra: 23.063, dec: 28.083, mag: 2.42, con: 'Pegasus' },
  { name: 'Markab', ra: 23.079, dec: 15.205, mag: 2.49, con: 'Pegasus' },
  { name: 'Algenib', ra: 0.220, dec: 15.183, mag: 2.83, con: 'Pegasus' },
  // Andromeda
  { name: 'Alpheratz', ra: 0.140, dec: 29.091, mag: 2.06, con: 'Andromeda' },
  { name: 'Mirach', ra: 1.163, dec: 35.621, mag: 2.05, con: 'Andromeda' },
  { name: 'Almach', ra: 2.065, dec: 42.330, mag: 2.17, con: 'Andromeda' },
  // Perseus
  { name: 'Mirfak', ra: 3.405, dec: 49.861, mag: 1.79, con: 'Perseus' },
  { name: 'Algol', ra: 3.136, dec: 40.956, mag: 2.12, con: 'Perseus' },
  // Auriga
  { name: 'Capella', ra: 5.278, dec: 45.998, mag: 0.08, con: 'Auriga' },
  { name: 'Menkalinan', ra: 5.992, dec: 44.948, mag: 1.90, con: 'Auriga' },
  // Ophiuchus
  { name: 'Rasalhague', ra: 17.582, dec: 12.560, mag: 2.07, con: 'Ophiuchus' },
  { name: 'Sabik', ra: 17.173, dec: -15.725, mag: 2.43, con: 'Ophiuchus' },
  // Eridanus
  { name: 'Achernar', ra: 1.629, dec: -57.237, mag: 0.46, con: 'Eridanus' },
  // Carina
  { name: 'Canopus', ra: 6.399, dec: -52.696, mag: -0.74, con: 'Carina' },
  // Others
  { name: 'Fomalhaut', ra: 22.961, dec: -29.622, mag: 1.16, con: 'PiscisAustrinus' },
  { name: 'Alnair', ra: 22.137, dec: -46.961, mag: 1.74, con: 'Grus' },
  { name: 'Peacock', ra: 20.428, dec: -56.735, mag: 1.94, con: 'Pavo' },
  // Draco
  { name: 'Eltanin', ra: 17.943, dec: 51.489, mag: 2.23, con: 'Draco' },
  { name: 'Rastaban', ra: 17.507, dec: 52.301, mag: 2.79, con: 'Draco' },
  // Hercules
  { name: 'Kornephoros', ra: 16.504, dec: 21.490, mag: 2.77, con: 'Hercules' },
  { name: 'Rasalgethi', ra: 17.244, dec: 14.390, mag: 3.37, con: 'Hercules' },
  // Corona Borealis
  { name: 'Alphecca', ra: 15.578, dec: 26.715, mag: 2.23, con: 'CoronaBorealis' },
];

// Sternbild-Linien
const CONSTELLATION_LINES = {
  Orion: [['Betelgeuse','Bellatrix'],['Bellatrix','Mintaka'],['Mintaka','Alnilam'],['Alnilam','Alnitak'],['Alnitak','Saiph'],['Saiph','Rigel'],['Rigel','Mintaka'],['Betelgeuse','Alnitak']],
  UrsaMajor: [['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],['Megrez','Dubhe']],
  UrsaMinor: [['Polaris','Kochab'],['Kochab','Pherkad']],
  Cassiopeia: [['Caph','Schedar'],['Schedar','Gamma Cas'],['Gamma Cas','Ruchbah'],['Ruchbah','Segin']],
  Scorpius: [['Graffias','Dschubba'],['Dschubba','Antares'],['Antares','Sargas'],['Sargas','Shaula'],['Shaula','Lesath']],
  Leo: [['Regulus','Algieba'],['Algieba','Zosma'],['Zosma','Denebola'],['Algieba','Ras Elased']],
  Gemini: [['Castor','Pollux'],['Castor','Tejat'],['Pollux','Alhena']],
  Cygnus: [['Deneb','Sadr'],['Sadr','Gienah'],['Sadr','Albireo']],
  Lyra: [['Vega','Sheliak'],['Sheliak','Sulafat'],['Sulafat','Vega']],
  Aquila: [['Altair','Tarazed']],
  Taurus: [['Aldebaran','Elnath'],['Aldebaran','Alcyone']],
  CanisMajor: [['Sirius','Mirzam'],['Sirius','Adhara'],['Adhara','Wezen']],
  Crux: [['Acrux','Gacrux'],['Mimosa','Gacrux']],
  Sagittarius: [['Kaus Australis','Kaus Media'],['Kaus Media','Kaus Borealis'],['Kaus Borealis','Nunki'],['Nunki','Ascella']],
  Pegasus: [['Markab','Scheat'],['Scheat','Alpheratz'],['Alpheratz','Algenib'],['Algenib','Markab']],
  Andromeda: [['Alpheratz','Mirach'],['Mirach','Almach']],
  Bootes: [['Arcturus','Izar']],
  Virgo: [['Spica','Porrima'],['Porrima','Vindemiatrix']],
  Aries: [['Hamal','Sheratan']],
  Libra: [['Zubeneschamali','Zubenelgenubi']],
};

// Städte
const CITIES = [
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'New York', lat: 40.713, lon: -74.006 },
  { name: 'London', lat: 51.507, lon: -0.128 },
  { name: 'Paris', lat: 48.857, lon: 2.352 },
  { name: 'Tokyo', lat: 35.690, lon: 139.692 },
  { name: 'Sydney', lat: -33.869, lon: 151.209 },
  { name: 'Los Angeles', lat: 34.052, lon: -118.244 },
  { name: 'Mumbai', lat: 19.076, lon: 72.878 },
  { name: 'Dubai', lat: 25.205, lon: 55.271 },
  { name: 'São Paulo', lat: -23.551, lon: -46.634 },
  { name: 'Moscow', lat: 55.756, lon: 37.617 },
  { name: 'Rome', lat: 41.903, lon: 12.496 },
  { name: 'Amsterdam', lat: 52.370, lon: 4.895 },
  { name: 'Vienna', lat: 48.208, lon: 16.374 },
  { name: 'Stockholm', lat: 59.329, lon: 18.069 },
  { name: 'Athens', lat: 37.984, lon: 23.728 },
  { name: 'Munich', lat: 48.137, lon: 11.576 },
  { name: 'Hamburg', lat: 53.551, lon: 9.994 },
  { name: 'Dresden', lat: 51.051, lon: 13.738 },
  { name: 'Zurich', lat: 47.377, lon: 8.541 },
  { name: 'Cape Town', lat: -33.925, lon: 18.424 },
  { name: 'Buenos Aires', lat: -34.604, lon: -58.382 },
  { name: 'Mexico City', lat: 19.433, lon: -99.133 },
  { name: 'Bangkok', lat: 13.756, lon: 100.502 },
  { name: 'Seoul', lat: 37.567, lon: 126.978 },
  { name: 'Singapore', lat: 1.352, lon: 103.820 },
  { name: 'Hong Kong', lat: 22.320, lon: 114.169 },
];

// Constellation display names (Deutsch)
const CONSTELLATION_NAMES = {
  Orion: 'Orion',
  UrsaMajor: 'Großer Bär',
  UrsaMinor: 'Kleiner Bär',
  Cassiopeia: 'Kassiopeia',
  Scorpius: 'Skorpion',
  Leo: 'Löwe',
  Taurus: 'Stier',
  Gemini: 'Zwillinge',
  Virgo: 'Jungfrau',
  CanisMajor: 'Großer Hund',
  CanisMinor: 'Kleiner Hund',
  Lyra: 'Leier',
  Cygnus: 'Schwan',
  Aquila: 'Adler',
  Sagittarius: 'Schütze',
  Capricornus: 'Steinbock',
  Aquarius: 'Wassermann',
  Pisces: 'Fische',
  Aries: 'Widder',
  Cancer: 'Krebs',
  Libra: 'Waage',
  Crux: 'Kreuz des Südens',
  Centaurus: 'Zentaur',
  Bootes: 'Bärenhüter',
  Pegasus: 'Pegasus',
  Andromeda: 'Andromeda',
  Perseus: 'Perseus',
  Auriga: 'Fuhrmann',
  Ophiuchus: 'Schlangenträger',
  Eridanus: 'Eridanus',
  Carina: 'Kiel des Schiffs',
  Draco: 'Drache',
  Hercules: 'Herkules',
  CoronaBorealis: 'Nördliche Krone',
  Grus: 'Kranich',
  Pavo: 'Pfau',
  PiscisAustrinus: 'Südlicher Fisch'
};

// ConstellationLabels component - renders constellation names as HTML overlay
function ConstellationLabels({ camera, renderer }) {
  const [labels, setLabels] = useState([]);
  
  useEffect(() => {
    if (!camera || !renderer || !window.__constellationLabels) return;
    
    const updateLabels = () => {
      const newLabels = [];
      const width = renderer.domElement.clientWidth;
      const height = renderer.domElement.clientHeight;
      
      Object.entries(window.__constellationLabels).forEach(([name, pos]) => {
        const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
        vector.project(camera);
        
        // Check if in front of camera
        if (vector.z > 1) return;
        
        const x = (vector.x * 0.5 + 0.5) * width;
        const y = (-(vector.y * 0.5) + 0.5) * height;
        
        // Only show if on screen
        if (x < 0 || x > width || y < 0 || y > height) return;
        
        newLabels.push({
          name: CONSTELLATION_NAMES[name] || name,
          x,
          y,
          key: name
        });
      });
      
      setLabels(newLabels);
    };
    
    updateLabels();
    const interval = setInterval(updateLabels, 100);
    return () => clearInterval(interval);
  }, [camera, renderer]);
  
  return (
    <>
      {labels.map(label => (
        <div
          key={label.key}
          style={{
            position: 'absolute',
            left: label.x,
            top: label.y,
            transform: 'translate(-50%, -50%)',
            color: 'rgba(100, 180, 220, 0.7)',
            fontSize: 11,
            fontWeight: 300,
            letterSpacing: 2,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap'
          }}
        >
          {label.name}
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANETARY DATA — J2000.0 Orbital Elements
// ─────────────────────────────────────────────────────────────────────────────

const PLANETS = {
  mercury: { name: 'Merkur', a: 0.387, e: 0.206, i: 7.0, omega: 48.33, w: 29.12, M0: 174.79, period: 87.97, radius: 0.25, color: '#A89F91', symbol: '☿' },
  venus: { name: 'Venus', a: 0.723, e: 0.007, i: 3.4, omega: 76.68, w: 54.88, M0: 50.45, period: 224.7, radius: 0.4, color: '#E8D598', symbol: '♀' },
  earth: { name: 'Erde', a: 1.000, e: 0.017, i: 0.0, omega: -11.26, w: 114.21, M0: 357.53, period: 365.25, radius: 0.42, color: '#4A90D9', symbol: '⊕' },
  mars: { name: 'Mars', a: 1.524, e: 0.093, i: 1.9, omega: 49.56, w: 286.5, M0: 19.41, period: 686.98, radius: 0.3, color: '#CD5C5C', symbol: '♂' },
  jupiter: { name: 'Jupiter', a: 5.203, e: 0.048, i: 1.3, omega: 100.46, w: 273.87, M0: 20.02, period: 4332.59, radius: 1.1, color: '#D4A574', symbol: '♃' },
  saturn: { name: 'Saturn', a: 9.537, e: 0.054, i: 2.5, omega: 113.64, w: 339.39, M0: 317.02, period: 10759.22, radius: 0.95, color: '#F4D03F', symbol: '♄', rings: true },
  uranus: { name: 'Uranus', a: 19.19, e: 0.047, i: 0.8, omega: 74.0, w: 96.99, M0: 142.24, period: 30688.5, radius: 0.55, color: '#7EC8E3', symbol: '⛢' },
  neptune: { name: 'Neptun', a: 30.07, e: 0.009, i: 1.8, omega: 131.78, w: 273.19, M0: 256.23, period: 60182.0, radius: 0.52, color: '#4169E1', symbol: '♆' },
};

const SUN_RADIUS = 1.5;
const ORBIT_SCALE = 25;

// ─────────────────────────────────────────────────────────────────────────────
// ASTRONOMICAL CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Kepler Equation Solver
function solveKepler(M, e, tol = 1e-8) {
  let E = M;
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// Planet Position (ecliptic coordinates)
function getPlanetPosition(planet, daysSinceJ2000, scale = ORBIT_SCALE) {
  const { a, e, i, omega, w, M0, period } = planet;
  const n = (2 * Math.PI) / period;
  const M = ((M0 * Math.PI / 180) + n * daysSinceJ2000) % (2 * Math.PI);
  const E = solveKepler(M, e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));
  const xOrb = r * Math.cos(nu), yOrb = r * Math.sin(nu);
  const iRad = i * Math.PI / 180, omegaRad = omega * Math.PI / 180, wRad = w * Math.PI / 180;
  const cosO = Math.cos(omegaRad), sinO = Math.sin(omegaRad);
  const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
  const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
  const scaled = Math.log10(r + 1) * scale;
  const factor = scaled / r;
  return { x: x * factor, y: z * factor, z: -y * factor, distance: r, ra: 0, dec: 0 };
}

// Julian Date from Date object
function dateToJD(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440 + date.getUTCSeconds()/86400;
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// Days since J2000.0
function daysSinceJ2000(date) {
  return dateToJD(date) - 2451545.0;
}

// Greenwich Mean Sidereal Time (in hours)
function getGMST(jd) {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15; // Convert to hours
}

// Local Sidereal Time (in hours)
function getLST(jd, longitude) {
  const gmst = getGMST(jd);
  let lst = gmst + longitude / 15;
  return ((lst % 24) + 24) % 24;
}

// Equatorial to Horizontal coordinates
function equatorialToHorizontal(ra, dec, lat, lst) {
  const raRad = ra * 15 * Math.PI / 180; // RA in hours → radians
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lstRad = lst * 15 * Math.PI / 180; // LST in hours → radians
  
  const ha = lstRad - raRad; // Hour Angle
  
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);
  
  const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
  const sinAz = -Math.cos(decRad) * Math.sin(ha) / Math.cos(alt);
  let az = Math.atan2(sinAz, cosAz);
  
  return {
    altitude: alt * 180 / Math.PI,
    azimuth: ((az * 180 / Math.PI) + 360) % 360
  };
}

// Convert horizontal to 3D position on sky dome
function horizontalTo3D(alt, az, radius = 100) {
  const altRad = alt * Math.PI / 180;
  const azRad = az * Math.PI / 180;
  // Y is up, X is east, Z is north
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.sin(altRad);
  const z = radius * Math.cos(altRad) * Math.cos(azRad);
  return { x, y, z };
}

// Planet RA/Dec from ecliptic position
function eclipticToEquatorial(x, y, z, obliquity = 23.439) {
  const eps = obliquity * Math.PI / 180;
  const xEq = x;
  const yEq = y * Math.cos(eps) - z * Math.sin(eps);
  const zEq = y * Math.sin(eps) + z * Math.cos(eps);
  const r = Math.sqrt(xEq*xEq + yEq*yEq + zEq*zEq);
  const dec = Math.asin(zEq / r) * 180 / Math.PI;
  let ra = Math.atan2(yEq, xEq) * 180 / Math.PI;
  ra = ((ra + 360) % 360) / 15; // Convert to hours
  return { ra, dec };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CelestialOrrery() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const planetMeshesRef = useRef({});
  const orbitLinesRef = useRef({});
  const saturnRingsRef = useRef(null);
  const starMeshesRef = useRef([]);
  const constellationLinesRef = useRef([]);
  const skyDomeRef = useRef(null);
  const horizonRef = useRef(null);
  
  // State
  const [viewMode, setViewMode] = useState('orrery'); // 'orrery', 'transition', 'planetarium'
  const [showOrbits, setShowOrbits] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [simTime, setSimTime] = useState(() => daysSinceJ2000(new Date()));
  const [speed, setSpeed] = useState(86400);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dateInput, setDateInput] = useState('');
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [birthData, setBirthData] = useState(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [selectedStar, setSelectedStar] = useState(null);
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [hoveredObject, setHoveredObject] = useState(null);
  
  const currentDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0) + simTime * 24 * 60 * 60 * 1000);
  const jd = dateToJD(currentDate);
  const observerLat = customLat ? parseFloat(customLat) : selectedCity.lat;
  const observerLon = customLon ? parseFloat(customLon) : selectedCity.lon;
  const lst = getLST(jd, observerLon);
  
  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(100, 80, 100);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const sunLight = new THREE.PointLight('#FFFFEE', 2, 800);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight('#334455', 0.4));
    
    // Sun
    const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#FFF5E0' });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);
    
    // Sun glow layers
    [1.3, 1.6, 2.0, 2.5].forEach((s, i) => {
      const glowGeo = new THREE.SphereGeometry(SUN_RADIUS * s, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: ['#FFE4B5', '#FFD700', '#FFA500', '#FF6B35'][i],
        transparent: true,
        opacity: [0.3, 0.15, 0.08, 0.04][i],
        side: THREE.BackSide
      });
      scene.add(new THREE.Mesh(glowGeo, glowMat));
    });
    
    // Create planets
    Object.entries(PLANETS).forEach(([key, planet]) => {
      const geo = new THREE.SphereGeometry(planet.radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: planet.color,
        roughness: 0.7,
        metalness: 0.1,
        emissive: planet.color,
        emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      planetMeshesRef.current[key] = mesh;
      
      // Saturn rings
      if (planet.rings) {
        const ringGeo = new THREE.RingGeometry(planet.radius * 1.4, planet.radius * 2.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#C9B896',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2.5;
        scene.add(rings);
        saturnRingsRef.current = rings;
      }
      
      // Orbit path
      const orbitPoints = [];
      for (let angle = 0; angle <= 360; angle += 2) {
        const M = angle * Math.PI / 180;
        const E = solveKepler(M, planet.e);
        const nu = 2 * Math.atan2(Math.sqrt(1 + planet.e) * Math.sin(E / 2), Math.sqrt(1 - planet.e) * Math.cos(E / 2));
        const r = planet.a * (1 - planet.e * Math.cos(E));
        const xOrb = r * Math.cos(nu), yOrb = r * Math.sin(nu);
        const iRad = planet.i * Math.PI / 180, omegaRad = planet.omega * Math.PI / 180, wRad = planet.w * Math.PI / 180;
        const cosO = Math.cos(omegaRad), sinO = Math.sin(omegaRad);
        const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
        const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
        const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
        const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
        const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
        const scaled = Math.log10(r + 1) * ORBIT_SCALE;
        const factor = scaled / r;
        orbitPoints.push(new THREE.Vector3(x * factor, z * factor, -y * factor));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({ color: planet.color, transparent: true, opacity: 0.15 });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);
      orbitLinesRef.current[key] = orbitLine;
    });
    
    // Background stars for Orrery
    const starGeo = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 8000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 400;
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.8, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));
    
    // Camera controls
    let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 160 };
    let targetSpherical = { ...spherical };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    
    const onMouseDown = (e) => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging || viewMode === 'planetarium') return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      targetSpherical.theta -= dx * 0.005;
      targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, targetSpherical.phi + dy * 0.005));
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e) => { 
      e.preventDefault(); 
      if (viewMode === 'planetarium') return;
      targetSpherical.radius = Math.max(25, Math.min(600, targetSpherical.radius + e.deltaY * 0.25)); 
    };
    
    containerRef.current.addEventListener('mousedown', onMouseDown);
    containerRef.current.addEventListener('mouseup', onMouseUp);
    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('wheel', onWheel, { passive: false });
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (viewMode === 'orrery') {
        spherical.theta += (targetSpherical.theta - spherical.theta) * 0.08;
        spherical.phi += (targetSpherical.phi - spherical.phi) * 0.08;
        spherical.radius += (targetSpherical.radius - spherical.radius) * 0.08;
        
        camera.position.set(
          spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
          spherical.radius * Math.cos(spherical.phi),
          spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
        );
        camera.lookAt(0, 0, 0);
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Resize handler
    const handleResize = () => {
      const w = containerRef.current?.clientWidth || window.innerWidth;
      const h = containerRef.current?.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('mousedown', onMouseDown);
      containerRef.current?.removeEventListener('mouseup', onMouseUp);
      containerRef.current?.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeEventListener('wheel', onWheel);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);
  
  // Update planet positions
  useEffect(() => {
    Object.entries(PLANETS).forEach(([key, planet]) => {
      const mesh = planetMeshesRef.current[key];
      if (!mesh) return;
      const pos = getPlanetPosition(planet, simTime);
      mesh.position.set(pos.x, pos.y, pos.z);
      
      if (key === 'saturn' && saturnRingsRef.current) {
        saturnRingsRef.current.position.set(pos.x, pos.y, pos.z);
      }
    });
  }, [simTime]);
  
  // Toggle orbits visibility
  useEffect(() => {
    Object.values(orbitLinesRef.current).forEach(line => { if (line) line.visible = showOrbits && viewMode === 'orrery'; });
  }, [showOrbits, viewMode]);
  
  // Time animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimTime(t => t + speed / 86400);
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);
  
  // Handle date jump
  const handleDateJump = () => {
    if (!dateInput) return;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return;
    setSimTime(daysSinceJ2000(date));
    setIsPlaying(false);
  };
  
  // Create Planetarium view
  const createPlanetariumView = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    
    // Clear old planetarium objects
    starMeshesRef.current.forEach(m => scene.remove(m));
    constellationLinesRef.current.forEach(l => scene.remove(l));
    if (skyDomeRef.current) scene.remove(skyDomeRef.current);
    if (horizonRef.current) scene.remove(horizonRef.current);
    starMeshesRef.current = [];
    constellationLinesRef.current = [];
    
    // Hide orrery elements
    Object.values(planetMeshesRef.current).forEach(m => { if (m) m.visible = false; });
    Object.values(orbitLinesRef.current).forEach(l => { if (l) l.visible = false; });
    if (saturnRingsRef.current) saturnRingsRef.current.visible = false;
    
    // Sky dome with gradient
    const skyGeo = new THREE.SphereGeometry(500, 64, 64);
    const skyVertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const skyFragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 nightSky = vec3(0.02, 0.02, 0.06);
        vec3 horizonWest = vec3(0.4, 0.15, 0.1); // Abendrot (Westen)
        vec3 horizonEast = vec3(0.35, 0.25, 0.15); // Morgengrauen (Osten)
        
        float horizonBlend = smoothstep(-0.1, 0.3, h);
        float eastWest = (normalize(vWorldPosition).x + 1.0) * 0.5;
        
        vec3 horizonColor = mix(horizonWest, horizonEast, eastWest);
        vec3 finalColor = mix(horizonColor, nightSky, horizonBlend);
        
        // Leichter Dunst am Horizont
        float haze = 1.0 - smoothstep(0.0, 0.15, h);
        finalColor += vec3(0.08, 0.06, 0.04) * haze * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    skyDomeRef.current = sky;
    
    // Horizon ring with glow
    const horizonRingGeo = new THREE.TorusGeometry(200, 0.5, 16, 100);
    const horizonRingMat = new THREE.MeshBasicMaterial({
      color: '#443322',
      transparent: true,
      opacity: 0.6
    });
    const horizonRing = new THREE.Mesh(horizonRingGeo, horizonRingMat);
    horizonRing.rotation.x = Math.PI / 2;
    horizonRing.position.y = 0;
    scene.add(horizonRing);
    
    // Ground plane with subtle gradient
    const groundGeo = new THREE.CircleGeometry(250, 64);
    const groundVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const groundFragmentShader = `
      varying vec2 vUv;
      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        vec3 center = vec3(0.02, 0.02, 0.03);
        vec3 edge = vec3(0.08, 0.06, 0.05);
        vec3 color = mix(center, edge, dist);
        float alpha = smoothstep(1.0, 0.8, dist);
        gl_FragColor = vec4(color, alpha * 0.95);
      }
    `;
    const groundMat = new THREE.ShaderMaterial({
      vertexShader: groundVertexShader,
      fragmentShader: groundFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);
    horizonRef.current = ground;
    
    // Atmospheric glow at horizon
    for (let i = 0; i < 3; i++) {
      const glowGeo = new THREE.TorusGeometry(200 + i * 5, 8 - i * 2, 8, 100);
      const glowMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? '#553322' : (i === 1 ? '#442211' : '#331100'),
        transparent: true,
        opacity: 0.08 - i * 0.02,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.y = 2 + i * 3;
      scene.add(glow);
      constellationLinesRef.current.push(glow);
    }
    
    // Create stars
    const starIndexMap = {};
    const constellationCenters = {};
    
    STARS.forEach((star, idx) => {
      const { altitude, azimuth } = equatorialToHorizontal(star.ra, star.dec, observerLat, lst);
      
      // Only show stars above horizon
      if (altitude < -2) return;
      
      const pos = horizontalTo3D(altitude, azimuth, 150);
      const size = Math.max(0.4, 3.0 - star.mag * 0.5);
      
      // Star with glow effect
      const starGeo = new THREE.SphereGeometry(size, 16, 16);
      const brightness = Math.min(1, Math.max(0.4, 1.2 - star.mag / 3));
      
      // Color based on spectral type (approximated by magnitude)
      let starColor;
      if (star.mag < 0) starColor = new THREE.Color().setHSL(0.15, 0.3, 0.95); // Bright = slightly warm
      else if (star.mag < 1) starColor = new THREE.Color().setHSL(0.12, 0.2, 0.9);
      else if (star.mag < 2) starColor = new THREE.Color().setHSL(0.1, 0.15, 0.85);
      else starColor = new THREE.Color().setHSL(0.08, 0.1, 0.75);
      
      const starMat = new THREE.MeshBasicMaterial({ color: starColor });
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starMesh.position.set(pos.x, pos.y, pos.z);
      starMesh.userData = { ...star, altitude, azimuth, type: 'star' };
      scene.add(starMesh);
      starMeshesRef.current.push(starMesh);
      starIndexMap[star.name] = { mesh: starMesh, pos };
      
      // Star glow
      if (star.mag < 2) {
        const glowSize = size * (star.mag < 0 ? 4 : (star.mag < 1 ? 3 : 2));
        const glowGeo = new THREE.SphereGeometry(glowSize, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: starColor,
          transparent: true,
          opacity: 0.15
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.copy(starMesh.position);
        scene.add(glowMesh);
        starMeshesRef.current.push(glowMesh);
      }
      
      // Track constellation centers
      if (star.con) {
        if (!constellationCenters[star.con]) {
          constellationCenters[star.con] = { x: 0, y: 0, z: 0, count: 0, visible: true };
        }
        constellationCenters[star.con].x += pos.x;
        constellationCenters[star.con].y += pos.y;
        constellationCenters[star.con].z += pos.z;
        constellationCenters[star.con].count++;
      }
    });
    
    // Constellation lines
    if (showConstellations) {
      Object.entries(CONSTELLATION_LINES).forEach(([conName, lines]) => {
        lines.forEach(([star1Name, star2Name]) => {
          const star1 = starIndexMap[star1Name];
          const star2 = starIndexMap[star2Name];
          if (!star1 || !star2) return;
          
          const points = [
            new THREE.Vector3(star1.pos.x, star1.pos.y, star1.pos.z),
            new THREE.Vector3(star2.pos.x, star2.pos.y, star2.pos.z)
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: '#4499BB',
            transparent: true,
            opacity: 0.35
          });
          const line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          constellationLinesRef.current.push(line);
        });
      });
    }
    
    // Calculate constellation label positions (stored for HTML overlay)
    const labelPositions = {};
    Object.entries(constellationCenters).forEach(([name, data]) => {
      if (data.count > 0 && data.visible) {
        labelPositions[name] = {
          x: data.x / data.count,
          y: data.y / data.count,
          z: data.z / data.count
        };
      }
    });
    window.__constellationLabels = labelPositions;
    
    // Add visible planets to sky
    Object.entries(PLANETS).forEach(([key, planet]) => {
      if (key === 'earth') return;
      
      // Get geocentric position
      const earthPos = getPlanetPosition(PLANETS.earth, simTime, 1);
      const planetPos = getPlanetPosition(planet, simTime, 1);
      
      // Vector from Earth to planet
      const dx = planetPos.x - earthPos.x;
      const dy = planetPos.y - earthPos.y;
      const dz = planetPos.z - earthPos.z;
      
      // Convert to equatorial
      const { ra, dec } = eclipticToEquatorial(-dz, dx, dy);
      const { altitude, azimuth } = equatorialToHorizontal(ra, dec, observerLat, lst);
      
      if (altitude < -2) return;
      
      const pos = horizontalTo3D(altitude, azimuth, 145);
      
      // Planet with distinctive appearance
      const planetSize = key === 'venus' || key === 'jupiter' ? 3.5 : 2.5;
      const planetGeo = new THREE.SphereGeometry(planetSize, 16, 16);
      const planetMat = new THREE.MeshBasicMaterial({ color: planet.color });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetMesh.position.set(pos.x, pos.y, pos.z);
      planetMesh.userData = { name: planet.name, type: 'planet', symbol: planet.symbol, altitude, azimuth, color: planet.color };
      scene.add(planetMesh);
      starMeshesRef.current.push(planetMesh);
      
      // Planet glow
      const glowGeo = new THREE.SphereGeometry(planetSize * 2.5, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: planet.color,
        transparent: true,
        opacity: 0.2
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(planetMesh.position);
      scene.add(glowMesh);
      starMeshesRef.current.push(glowMesh);
    });
    
    // Position camera for planetarium (looking up from ground)
    camera.position.set(0, 5, 0);
    camera.lookAt(0, 100, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
    
  }, [observerLat, lst, simTime, showConstellations]);
  
  // Switch to Planetarium view
  const enterPlanetarium = () => {
    setViewMode('planetarium');
    setIsPlaying(false);
    createPlanetariumView();
  };
  
  // Return to Orrery
  const exitPlanetarium = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    
    // Remove planetarium objects
    starMeshesRef.current.forEach(m => scene.remove(m));
    constellationLinesRef.current.forEach(l => scene.remove(l));
    if (skyDomeRef.current) scene.remove(skyDomeRef.current);
    if (horizonRef.current) scene.remove(horizonRef.current);
    starMeshesRef.current = [];
    constellationLinesRef.current = [];
    window.__constellationLabels = null;
    
    // Show orrery elements
    Object.values(planetMeshesRef.current).forEach(m => { if (m) m.visible = true; });
    Object.values(orbitLinesRef.current).forEach(l => { if (l) l.visible = showOrbits; });
    if (saturnRingsRef.current) saturnRingsRef.current.visible = true;
    
    // Reset camera
    if (cameraRef.current) {
      cameraRef.current.position.set(100, 80, 100);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.fov = 60;
      cameraRef.current.updateProjectionMatrix();
    }
    
    setHoveredObject(null);
    setViewMode('orrery');
  };
  
  // Planetarium mouse look + hover detection
  useEffect(() => {
    if (viewMode !== 'planetarium' || !containerRef.current) return;
    
    let lookAz = 180, lookAlt = 45;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      lookAz = 180 + x * 180;
      lookAlt = 45 - y * 90;
      lookAlt = Math.max(5, Math.min(85, lookAlt));
      
      if (cameraRef.current) {
        const target = horizontalTo3D(lookAlt, lookAz, 100);
        cameraRef.current.position.set(0, 5, 0);
        cameraRef.current.lookAt(target.x, target.y, target.z);
      }
      
      // Raycasting for hover
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (cameraRef.current && sceneRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(starMeshesRef.current, false);
        
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          if (obj.userData && (obj.userData.name || obj.userData.type)) {
            setHoveredObject({
              ...obj.userData,
              screenX: e.clientX - rect.left,
              screenY: e.clientY - rect.top
            });
          } else {
            setHoveredObject(null);
          }
        } else {
          setHoveredObject(null);
        }
      }
    };
    
    containerRef.current.addEventListener('mousemove', onMouseMove);
    return () => containerRef.current?.removeEventListener('mousemove', onMouseMove);
  }, [viewMode]);
  
  // Birth chart transition
  const showBirthChart = (birthDate, birthTime, city) => {
    const [y, m, d] = birthDate.split('-').map(Number);
    const [h, min] = birthTime.split(':').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, h, min));
    
    setBirthData({ date, city });
    setSimTime(daysSinceJ2000(date));
    setSelectedCity(city);
    setIsPlaying(false);
    
    // Animate zoom to Earth then switch to planetarium
    setViewMode('transition');
    setTransitionProgress(0);
    
    const animateTransition = () => {
      setTransitionProgress(p => {
        if (p >= 1) {
          enterPlanetarium();
          return 1;
        }
        
        const eased = 1 - Math.pow(1 - p, 3);
        const earthPos = getPlanetPosition(PLANETS.earth, simTime);
        
        if (cameraRef.current) {
          const startPos = { x: 100, y: 80, z: 100 };
          const endPos = { x: earthPos.x + 2, y: earthPos.y + 1, z: earthPos.z + 2 };
          
          cameraRef.current.position.set(
            startPos.x + (endPos.x - startPos.x) * eased,
            startPos.y + (endPos.y - startPos.y) * eased,
            startPos.z + (endPos.z - startPos.z) * eased
          );
          cameraRef.current.lookAt(earthPos.x, earthPos.y, earthPos.z);
        }
        
        requestAnimationFrame(animateTransition);
        return p + 0.015;
      });
    };
    
    animateTransition();
  };
  
  const dateString = currentDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = currentDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  
  const speedOptions = [
    { label: '1×', value: 1 },
    { label: '1 min/s', value: 60 },
    { label: '1 h/s', value: 3600 },
    { label: '1 Tag/s', value: 86400 },
    { label: '1 Wo/s', value: 604800 },
    { label: '1 Mo/s', value: 2592000 },
    { label: '1 Jahr/s', value: 31536000 },
  ];
  
  // Styles
  const panelStyle = {
    background: 'rgba(10, 10, 20, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: '1px solid rgba(212, 175, 55, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    color: '#E8DCC4'
  };
  
  const buttonStyle = (active = false) => ({
    padding: '8px 14px',
    borderRadius: 8,
    background: active ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.03)',
    border: active ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#D4AF37' : '#888',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    transition: 'all 0.2s'
  });
  
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#D4AF37',
    fontSize: 12,
    fontFamily: "'SF Mono', 'Monaco', monospace",
    outline: 'none'
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0f0f1a 100%)', position: 'relative', overflow: 'hidden', fontFamily: "'SF Mono', 'Monaco', monospace" }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: viewMode === 'orrery' ? 'grab' : 'crosshair' }} />
      
      {/* Title */}
      <div style={{ position: 'absolute', top: 24, left: 24, color: '#D4AF37', fontSize: 11, fontWeight: 300, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.7 }}>
        {viewMode === 'orrery' ? 'Solar System Orrery' : 'Planetarium View'}
      </div>
      
      {/* View Toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24, ...panelStyle, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <button onClick={exitPlanetarium} style={buttonStyle(viewMode === 'orrery')}>
          Sonnensystem
        </button>
        <button onClick={enterPlanetarium} style={buttonStyle(viewMode === 'planetarium')}>
          Sternenhimmel
        </button>
      </div>
      
      {/* Location Panel (Planetarium mode) */}
      {viewMode === 'planetarium' && (
        <div style={{ position: 'absolute', top: 80, right: 24, ...panelStyle, padding: 18, minWidth: 240 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(212, 175, 55, 0.6)', marginBottom: 12 }}>Beobachtungsort</div>
          <select
            value={customLat ? '__custom__' : selectedCity.name}
            onChange={(e) => {
              if (e.target.value === '__custom__') return;
              const city = CITIES.find(c => c.name === e.target.value);
              if (city) {
                setSelectedCity(city);
                setCustomLat('');
                setCustomLon('');
                setTimeout(createPlanetariumView, 50);
              }
            }}
            style={{ ...inputStyle, width: '100%', marginBottom: 10, cursor: 'pointer' }}
          >
            {CITIES.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
            {customLat && <option value="__custom__">Eigene Koordinaten</option>}
          </select>
          
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.4)', marginTop: 12, marginBottom: 8 }}>Oder eigene Koordinaten:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Breitengrad</label>
              <input
                type="number"
                step="0.01"
                min="-90"
                max="90"
                placeholder="z.B. 52.52"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                style={{ ...inputStyle, width: '100%', fontSize: 11 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Längengrad</label>
              <input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                placeholder="z.B. 13.40"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                style={{ ...inputStyle, width: '100%', fontSize: 11 }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (customLat && customLon) {
                setTimeout(createPlanetariumView, 50);
              }
            }}
            style={{ ...buttonStyle(customLat && customLon), width: '100%', marginTop: 10, padding: '8px 12px' }}
          >
            Koordinaten anwenden
          </button>
          
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
            📍 {observerLat.toFixed(4)}° {observerLat >= 0 ? 'N' : 'S'}, {Math.abs(observerLon).toFixed(4)}° {observerLon >= 0 ? 'E' : 'W'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(212, 175, 55, 0.5)', marginTop: 4 }}>
            ⏱ Sternzeit: {lst.toFixed(2)}h
          </div>
          
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#888' }}>
              <input
                type="checkbox"
                checked={showConstellations}
                onChange={(e) => {
                  setShowConstellations(e.target.checked);
                  setTimeout(createPlanetariumView, 50);
                }}
                style={{ accentColor: '#D4AF37' }}
              />
              Sternbilder anzeigen
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: '#888', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={showConstellationNames}
                onChange={(e) => {
                  setShowConstellationNames(e.target.checked);
                  setTimeout(createPlanetariumView, 50);
                }}
                style={{ accentColor: '#D4AF37' }}
              />
              Sternbild-Namen
            </label>
          </div>
        </div>
      )}
      
      {/* Birth Chart Panel */}
      {viewMode === 'orrery' && (
        <div style={{ position: 'absolute', top: 80, right: 24, ...panelStyle, padding: 18, minWidth: 260 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(212, 175, 55, 0.6)', marginBottom: 14 }}>Geburtsdaten eingeben</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="date"
              id="birthDate"
              style={inputStyle}
              defaultValue="1990-01-01"
            />
            <input
              type="time"
              id="birthTime"
              style={inputStyle}
              defaultValue="12:00"
            />
            <select
              id="birthCity"
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {CITIES.map(city => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const date = document.getElementById('birthDate').value;
                const time = document.getElementById('birthTime').value;
                const cityName = document.getElementById('birthCity').value;
                const city = CITIES.find(c => c.name === cityName);
                if (date && time && city) {
                  showBirthChart(date, time, city);
                }
              }}
              style={{
                ...buttonStyle(true),
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.15) 100%)',
                padding: '12px 20px',
                fontSize: 12,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}
            >
              ★ Zeige deinen Sternenhimmel
            </button>
          </div>
        </div>
      )}
      
      {/* Time Controller (Orrery mode) */}
      {viewMode === 'orrery' && (
        <>
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', ...panelStyle, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center', minWidth: 160 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(212, 175, 55, 0.6)', marginBottom: 4 }}>Datum</div>
              <div style={{ fontSize: 14, fontWeight: 300, color: '#D4AF37', letterSpacing: 1 }}>{dateString}</div>
              <div style={{ fontSize: 11, fontWeight: 300, color: 'rgba(212, 175, 55, 0.7)', marginTop: 2 }}>{timeString}</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(212, 175, 55, 0.2)' }} />
            <button onClick={() => setIsPlaying(!isPlaying)} style={{ ...buttonStyle(isPlaying), width: 40, height: 40, borderRadius: 10, fontSize: 16 }}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {speedOptions.map(opt => (
                <button key={opt.value} onClick={() => setSpeed(opt.value)} style={buttonStyle(speed === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => { setSimTime(daysSinceJ2000(new Date())); setIsPlaying(true); }} style={{ ...buttonStyle(false), padding: '9px 18px', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Heute</button>
            <button onClick={() => setShowOrbits(!showOrbits)} style={buttonStyle(showOrbits)}>Orbits</button>
          </div>
          
          {/* Date Input */}
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', ...panelStyle, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(212, 175, 55, 0.6)' }}>Springe zu:</label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleDateJump} style={{ ...buttonStyle(true), padding: '8px 16px', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              Los
            </button>
          </div>
        </>
      )}
      
      {/* Planetarium Date/Time display */}
      {viewMode === 'planetarium' && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', ...panelStyle, padding: '14px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(212, 175, 55, 0.6)', marginBottom: 4 }}>
            {birthData ? 'Dein Geburtshimmel' : 'Sternenhimmel'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 300, color: '#D4AF37', letterSpacing: 1 }}>
            {dateString}, {timeString}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {selectedCity.name}
          </div>
        </div>
      )}
      
      {/* Transition overlay */}
      {viewMode === 'transition' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: `rgba(0, 0, 0, ${transitionProgress * 0.3})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ color: '#D4AF37', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', opacity: transitionProgress }}>
            Reise zur Erde...
          </div>
        </div>
      )}
      
      {/* Compass (Planetarium) */}
      {viewMode === 'planetarium' && (
        <>
          <div style={{ 
            position: 'absolute', 
            bottom: 100, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            gap: 60, 
            color: 'rgba(212, 175, 55, 0.5)', 
            fontSize: 14, 
            letterSpacing: 3,
            fontWeight: 300
          }}>
            <span style={{ color: 'rgba(100, 180, 255, 0.6)' }}>W</span>
            <span style={{ color: 'rgba(255, 200, 100, 0.7)' }}>N</span>
            <span style={{ color: 'rgba(255, 150, 100, 0.6)' }}>O</span>
            <span style={{ color: 'rgba(150, 150, 200, 0.5)' }}>S</span>
          </div>
          
          {/* Horizont-Beschriftung */}
          <div style={{
            position: 'absolute',
            bottom: 130,
            left: 40,
            color: 'rgba(255, 150, 100, 0.4)',
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            Sonnenuntergang ←
          </div>
          <div style={{
            position: 'absolute',
            bottom: 130,
            right: 40,
            color: 'rgba(255, 200, 150, 0.4)',
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            → Sonnenaufgang
          </div>
        </>
      )}
      
      {/* Constellation Names Overlay */}
      {viewMode === 'planetarium' && showConstellationNames && (
        <ConstellationLabels camera={cameraRef.current} renderer={rendererRef.current} />
      )}
      
      {/* Hover Tooltip */}
      {hoveredObject && viewMode === 'planetarium' && (
        <div style={{
          position: 'absolute',
          left: hoveredObject.screenX + 15,
          top: hoveredObject.screenY - 10,
          ...panelStyle,
          padding: '10px 14px',
          pointerEvents: 'none',
          zIndex: 100,
          minWidth: 120
        }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 500, 
            color: hoveredObject.type === 'planet' ? hoveredObject.color : '#D4AF37',
            marginBottom: 4
          }}>
            {hoveredObject.type === 'planet' && <span style={{ marginRight: 6 }}>{hoveredObject.symbol}</span>}
            {hoveredObject.name}
          </div>
          {hoveredObject.con && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              {CONSTELLATION_NAMES[hoveredObject.con] || hoveredObject.con}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Alt: {hoveredObject.altitude.toFixed(1)}° • Az: {hoveredObject.azimuth.toFixed(1)}°
          </div>
          {hoveredObject.mag !== undefined && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              Helligkeit: {hoveredObject.mag.toFixed(2)} mag
            </div>
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div style={{ position: 'absolute', bottom: viewMode === 'orrery' ? 96 : 24, left: 24, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 300, letterSpacing: 1 }}>
        {viewMode === 'orrery' 
          ? 'Ziehen zum Drehen • Scrollen zum Zoomen' 
          : 'Maus bewegen um den Himmel zu erkunden'}
      </div>
    </div>
  );
}
