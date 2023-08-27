"use strict";

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
  #workouts = [];

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
    // console.log(this)
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=b37f0f2c-146f-4044-8c25-f6630572ed42",
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
    form.classList.remove('slowslide')
    this.#mapEvent = mapE;
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _hideForm () {
    form.classList.add('slowslide')
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
    form.classList.add('hidden')
    
  }

  _toggleElevationField () {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout (e) {
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const isNumber = (...nums) => nums.every(e => Number.isFinite(e));
    const allPositive = (...nums) => nums.every(e => e > 0);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // console.log(this.#mapEvent)
    // console.log(typeof type, typeof distance, typeof duration);
    // console.log(isNumber(duration, distance))
    
    if(type === 'running') {
      const cadence = +inputCadence.value; 
      if(!isNumber(duration, distance, cadence) || !allPositive(duration, distance, cadence)){
        return alert('Only positive numbers!')
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    if(type === 'cycling') {
      const elevation = +inputElevation.value;
      if(!isNumber(duration, distance, elevation) || !allPositive(duration, distance)){
        return alert('Only positive numbers!')
      }
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // console.log("WO:", workout);
    this.#workouts.push(workout);
    
    this._renderWorkoutMarker(workout);
    this._createWorkoutDescription(workout);
    this._hideForm();
  }

  _renderWorkoutMarker (workout) {
    let popupDesc = `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.dateDesc}`
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(popupDesc)
      .openPopup();
  }

  _createWorkoutDescription (workout) {
    let suffixHTML;
    let workoutHTML = `
      <li class="workout workout--${workout.type}" data-id='${workout.id}'>
        <h2 class="workout__title">${workout.dateDesc}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
    suffixHTML = `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;

    if (workout.type === 'cycling')
    suffixHTML = `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🚴‍♀️</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    
    workoutHTML += suffixHTML;
    // console.log(workoutHTML)
    form.insertAdjacentHTML('afterend', workoutHTML);
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

  _setDateDesc () {
    // prettier-ignore
    // const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // this.dateDesc = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    this.dateDesc = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.date.toLocaleString('default', { month: 'long' })} ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = "running";
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDateDesc();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDateDesc();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

const app = new App;



