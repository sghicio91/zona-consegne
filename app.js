let geojsonData;

// Inizializza la mappa con Leaflet
let map = L.map('map').setView([28.4636, -16.2518], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

let marker = null;

// Carica il file GeoJSON
fetch("zone_consegne_finale.geojson")
  .then(res => res.json())
  .then(data => {
    geojsonData = data;

    // Disegna i poligoni sulla mappa (opzionale)
   L.geoJSON(data, {
  style: function (feature) {
    const zona = feature.properties.name.toLowerCase();
    const colori = {
      "zona 1": "#4CAF50",     // verde
      "zona 2": "#FFEB3B",     // giallo
      "zona 3": "#FF9800",     // arancione
      "zona 4": "#F44336",      // rosso
      "zona 4 (valleseco)" : "#F44336"       // rosso
    };
    return {
      color: colori[zona] || "#000000",        // bordo
      fillColor: colori[zona] || "#cccccc",    // riempimento
      fillOpacity: 0.3,  // ≈70% trasparente
      weight: 2
    };
  },
  onEachFeature: function (feature, layer) {
    layer.bindPopup(`Zona: ${feature.properties.name}`);
  }
}).addTo(map);

  });

async function searchAddress() {
  const address = document.getElementById("address").value;
  const resultBox = document.getElementById("result");

  if (!address) {
    resultBox.innerText = "Inserisci un indirizzo valido.";
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Santa Cruz de Tenerife')}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.length === 0) {
    resultBox.innerText = "Indirizzo non trovato.";
    return;
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  const point = turf.point([lon, lat]);

  // Mostra il punto sulla mappa
  map.setView([lat, lon], 16);
  if (marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map).bindPopup("Indirizzo trovato").openPopup();

  let zona = null;

  for (const feature of geojsonData.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      zona = feature.properties.name;
      break;
    }
  }

  if (!zona) {
    resultBox.innerText = "Fuori zona di consegna.";
    return;
  }

  // Prezzi associati alle zone
  const prezzi = {
    "zona 1": "2,50 €",
    "zona 2": "3,50 €",
    "zona 3": "3,50 €",
    "zona 4": "5,50 €"
  };

  const prezzo = prezzi[zona.toLowerCase()] || "Prezzo non disponibile";
  resultBox.innerText = `Zona: ${zona}\nPrezzo consegna: ${prezzo}`;
}

// Attiva la ricerca anche premendo INVIO
document.getElementById("address").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    searchAddress();
  }
});
