"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map, mapEvent;

//ANCHOR - Geolocation
// console.log(navigator.geolocation)
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // console.log(position);
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      // console.log(latitude,longitude)
      // console.log(`https://www.google.com.tr/maps/@${latitude},${longitude}`)
      const coords = [latitude, longitude];
      map = L.map("map").setView(coords, 13);
      // console.log(map)

      // L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      //   attribution:
      //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // }).addTo(map);
      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
        {
          minZoom: 0,
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          ext: "png",
        }
      ).addTo(map);

      // L.marker(coords)
      //   .addTo(map)
      //   .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
      //   .openPopup();

      map.on("click", (mapE) => {
        // console.log(mapEvent);
        mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus()
      });
    },
    () => {
      alert("Could not get your position!");
    }
  );

form.addEventListener("submit", (e) => {
  e.preventDefault();
  inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value;
  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: "running-popup",
      })
    )
    .setPopupContent("Workout")
    .openPopup();
});

inputType.addEventListener('change', () => {
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
})