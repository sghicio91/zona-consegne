
let geojsonData;
let map = L.map('map').setView([28.4636, -16.2518], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

let marker = null;

fetch("zone_consegne_finale.geojson")
  .then(res => res.json())
  .then(data => {
    geojsonData = data;
    L.geoJSON(data, {
      style: function (feature) {
        const zona = feature.properties.name.toLowerCase();
        const colori = {
          "zona 1": "#4CAF50",
          "zona 2": "#FFEB3B",
          "zona 3": "#FF9800",
          "zona 4": "#F44336"
        };
        return {
          color: colori[zona] || "#000000",
          fillColor: colori[zona] || "#cccccc",
          fillOpacity: 0.3,
          weight: 2
        };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`Zona: ${feature.properties.name}`);
      }
    }).addTo(map);
  });

async function searchAddress() {
  const autocomplete = document.querySelector("gmpx-place-autocomplete");
  const place = autocomplete.value;

  const resultBox = document.getElementById("result");

  if (!place) {
    resultBox.innerText = "Inserisci un indirizzo valido.";
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place + ', Santa Cruz de Tenerife')}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.length === 0) {
    resultBox.innerText = "Indirizzo non trovato.";
    return;
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);
  const point = turf.point([lon, lat]);

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

  const prezzi = {
    "zona 1": "2,50 €",
    "zona 2": "3,50 €",
    "zona 3": "3,50 €",
    "zona 4": "5,50 €"
  };

  const prezzo = prezzi[zona.toLowerCase()] || "Prezzo non disponibile";
  resultBox.innerText = `Zona: ${zona}
Prezzo consegna: ${prezzo}`;
}
