import { hospitals } from "./data.js";

// Inisialisasi map pada koordinat callback default
const callBackLatLng = [-6.2903, 106.8346];
const map = L.map("map").setView(callBackLatLng, 12);
const btnRute = document.getElementById("calculate");
const btnNearest = document.getElementById("nearest");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Formula Haversine untuk menghitung jarak geografis langsung antara dua titik di permukaan bumi
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam kilometer
}

// Fungsi untuk menghasilkan rating dalam bentuk bintang
function generateStarRating(rating) {
  const fullStar = '<span class="star">★</span>';
  const emptyStar = '<span class="star">☆</span>';
  const roundedRating = Math.round(rating);
  return (
    fullStar.repeat(roundedRating) + emptyStar.repeat(5 - roundedRating)
  );
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLatLng = [position.coords.latitude, position.coords.longitude];
      map.flyTo(userLatLng, 14);
      L.marker(userLatLng).addTo(map).bindPopup("Your Location").openPopup();

      // Event handler untuk tombol perhitungan rute terpendek
      if (btnRute) {
        btnRute.addEventListener("click", () => calculateRoute(userLatLng));
      }
      // Event handler untuk tombol pencarian rumah sakit terdekat
      if (btnNearest) {
        btnNearest.addEventListener("click", () =>
          listNearestHospitals(userLatLng)
        );
      }
    },
    (error) => {
      alert("Gagal mendapatkan lokasi:", error);
    }
  );
} else {
  alert("Geolocation tidak didukung oleh browser ini.");
}

// Fungsi untuk memfilter dan menampilkan rumah sakit dalam radius tertentu
function listNearestHospitals(userLatLng) {
  const inputRad = document.getElementById("inputRad").value;
  if (inputRad <= 0) {
    alert("Masukkan radius yang valid!");
    return;
  }

  const filteredHospitals = hospitals.filter((hospital) => {
    const distance = haversine(
      userLatLng[0],
      userLatLng[1],
      hospital.coordinates.latitude,
      hospital.coordinates.longitude
    );
    return distance <= inputRad;
  });

  // Menampilkan rumah sakit di peta
  filteredHospitals.forEach((hospital) => {
    const starRating = generateStarRating(hospital.rating);
    L.marker([hospital.coordinates.latitude, hospital.coordinates.longitude])
      .addTo(map)
      .bindPopup(
        `<b>${hospital.name}</b><br>${hospital.address}<br>Rating: ${starRating}`
      );
    map.flyTo(
      [hospital.coordinates.latitude, hospital.coordinates.longitude],
      14
    );
  });

  // Menampilkan daftar rumah sakit di elemen HTML
  const hospitalListContainer = document.getElementById("hospitalList");

  if (hospitalListContainer) {
    hospitalListContainer.innerHTML = "";

    filteredHospitals.forEach((hospital) => {
        const listItem = document.createElement("li");

        // Tambahkan ikon pin dan konten list rumah sakit
        listItem.innerHTML = `
            <span style="color: red; font-size: 18px; margin-right: 10px;">
                <ion-icon name="location-sharp"></ion-icon>
            </span>
            <strong>${hospital.name}</strong> - ${hospital.address} <br>
            Rating: ${generateStarRating(hospital.rating)}
        `;

        hospitalListContainer.appendChild(listItem);
      });
  }

// Fungsi contoh untuk menghasilkan rating dengan bintang
function generateStarRating(rating) {
    let stars = "";
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? "⭐" : "☆";
    }
    return stars;
  }
}

// Fungsi untuk menghitung dan menampilkan rute jalan terpendek menggunakan algoritma Dijkstra
function calculateRoute(userLatLng) {
  const nearestHospital = hospitals
    .map((hospital) => {
      const distance = haversine(
        userLatLng[0],
        userLatLng[1],
        hospital.coordinates.latitude,
        hospital.coordinates.longitude
      );
      return { ...hospital, distance };
    })
    .sort((a, b) => a.distance - b.distance)[0];

  document.getElementById("nearestHospital").textContent = nearestHospital.name;
  map.flyTo(
    [
      nearestHospital.coordinates.latitude,
      nearestHospital.coordinates.longitude,
    ],
    14
  );

  // Menandai posisi awal dan akhir rute
  const startMarker = L.marker(userLatLng).addTo(map).bindPopup("Lokasi Anda");
  const endMarker = L.marker([
    nearestHospital.coordinates.latitude,
    nearestHospital.coordinates.longitude,
  ])
    .addTo(map)
    .bindPopup(nearestHospital.name);

  // Menggunakan Leaflet Routing Machine untuk menghitung rute jalan terpendek
  L.Routing.control({
    waypoints: [
      L.latLng(userLatLng),
      L.latLng([
        nearestHospital.coordinates.latitude,
        nearestHospital.coordinates.longitude,
      ]),
    ],
    routeWhileDragging: true,
  }).addTo(map);
}
