"use strict";

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
// const submitForm = document.querySelector(".form__button");

class App {
  #map;
  #mapEvent;
  constructor(){
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    // submitForm.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener('change',this._toggleElevationField)
  }

  _getPosition() {
    if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
      () => {
        alert("Could not get your position!");
      }
    );
  }

  _loadMap(position){
    console.log(this)
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
      {
        minZoom: 0,
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: "png",
      }
    ).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm (mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _toggleElevationField () {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout (e) {
    e.preventDefault();
    const type = inputType.value;
    const distance = inputDistance.value;
    const duration = inputDuration.value;
    const isNumber = (...nums) => nums.every(e => Number.isFinite(e));
    const allPositive = (...nums) => nums.every(e => e > 0);

    // console.log(type, distance, duration);

    if(type === 'running') {
      const cadence = +inputCadence.value; 
      if(!isNumber(duration, distance, cadence) || !allPositive(duration, distance, cadence)){
        return alert('Only positive numbers!')
      }
    }

    if(type === 'cycling') {
      const elevation = +inputElevation.value;
      if(!isNumber(duration, distance, elevation) || !allPositive(duration, distance)){
        return alert('Only positive numbers!')
      }
    }
    
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
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
  }
}

class Workout {
  id = (Date.now() + '').slice(-10);
  date = new Date;
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

}

class Running extends Workout {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

const app = new App;



