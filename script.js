"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const WelcomeInfo = document.querySelector(".info");
const submitBtn = document.querySelector(".form__btn");
const workoutList = document.querySelector(".workout-list");
const sortBtnContainer = document.querySelector(".sort-container");
const zoomOut = document.querySelector(".zoom-out");
const closeForm = document.querySelector(".close-form-btn");
const dropdown = document.querySelector(".dropdown");
const overlay = document.querySelector(".overlay");
// let deleteWBtn;

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #mapZoomLevel = 13;
  srtV = {
    dateV : 1,
    distanceV : 1,
    durationV : 1,
    speedV : 1,
  }

  constructor(){
    this._getPosition();
    this._getLocalStorage();
    this._welcomeInfo();

    form.addEventListener('submit', this._newWorkout.bind(this));
    submitBtn.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change',this._toggleElevationField)
    containerWorkouts.addEventListener('click', this._workoutOperations.bind(this));
    sortBtnContainer.addEventListener('click', this._sortEvent.bind(this));
    zoomOut.addEventListener('click', this._zoomToFit.bind(this));
    closeForm.addEventListener('click', this._hideForm);
    overlay.addEventListener('click', this._closeDropdown);
    dropdown.addEventListener('click', this._openDropdown.bind(this));

  }

  _showWarningModal(title, description) {
    let action;
    const wModal = document.querySelector(".w-modal");
    const wOverlay = document.querySelector(".w-overlay");
    document.querySelector(".m-title").textContent = title;
    document.querySelector(".m-desc").textContent = description;

    wModal.classList.remove('hidden')
    wOverlay.classList.remove('hidden')

    wOverlay.addEventListener('click', this._closeWarningModal)
    // const clsBtn = wModal.querySelector(".cls-btn")
    // const cancelBtn = wModal.querySelector(".cancel-btn")
    // const okBtn = wModal.querySelector(".ok-btn")

    return new Promise(function(resolve, reject) {
      wModal.addEventListener('click', modalAction)

      function modalAction(e) {
        // console.log(e.target)
        let targetBtn = e.target.classList;
        if(targetBtn.contains("cls-btn") || targetBtn.contains("cancel-btn")) resolve(false);
        if(targetBtn.contains("ok-btn")) resolve(true);
      }
    });
  }

  _closeWarningModal () {
    const wModal = document.querySelector(".w-modal");
    const wOverlay = document.querySelector(".w-overlay");
    wModal.classList.add('hidden')
    wOverlay.classList.add('hidden')
    return;
  }

  _openDropdown(e) {
    const workoutAll = document.querySelectorAll(".workout");
    const content = document.querySelector('.dropdown-content');
    content.classList.remove('hidden');
    overlay.classList.remove('hidden');

    content.addEventListener('click', select.bind(this))

    function select (e) {
      const act = e.target.closest('.dd-item').dataset.select;
      // console.log(act)
      if(!act) return;
      // console.log(workoutAll)

      workoutAll.forEach(f => {
        f.classList.remove('hidden')
        if(act === 'deleteAll') return;
        if(act === 'workouts') f.classList.remove('hidden')
        else if(f.dataset.wt !== act) f.classList.add('hidden')
      })

      if(act === 'deleteAll') this._deleteAll.bind(this, workoutAll)();
      
      this._closeDropdown();
    }
  }

  _closeDropdown (e) {
    const content = document.querySelector('.dropdown-content');
    content.classList.add('hidden');
    overlay.classList.add('hidden');
  }

  _welcomeInfo() {
    if(this.#workouts.length > 0) this._hideWelcomeInfo();
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
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

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
    this.#workouts.forEach(wo => this._renderWorkoutMarker(wo))
  }

  _hideWelcomeInfo() {
    WelcomeInfo.classList.add('hidden');
  }

  _zoomToFit () {
    // this._hideForm();
    // form.classList.add('hidden')
    let group = new L.featureGroup(this.#markers);
    this.#map.fitBounds(group.getBounds());
  }

  _showForm (mapE) {
    this._hideWelcomeInfo();
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
        return this._showWarningModal('Invalid Inputs', 'Inputs must have positive numbers!').then((p) => this._closeWarningModal());
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
    this._setLocalStorage();
  }

  _renderWorkoutMarker (workout) {
    let popupDesc = `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.dateDesc}`
    this.#markers.push(
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
      .openPopup()
    )
  }

  //ANCHOR - CREATE HTML
  _createWorkoutDescription (workout) {
    let suffixHTML;
    let workoutHTML = `
      <li class="workout workout--${workout.type}" data-wt='${workout.type}' data-id='${workout.id}'>
      <div class='workout-buttons'>
        <span class="material-symbols-outlined edit-icon">edit</span>
        <span class="material-symbols-outlined delete-icon">delete</span>
      </div>
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

    // form.insertAdjacentHTML('afterend', workoutHTML);
    workoutList.insertAdjacentHTML('afterbegin', workoutHTML);
    // deleteWBtn = document.querySelectorAll(".delete-icon");
  }

  _sortEvent(e) {
    const srtBtn = e.target.closest('.srt-btn');
    if(!srtBtn) return;
    const btnType = srtBtn.dataset.type;
    const siblings = document.querySelectorAll('.srt-btn')
    const whichSort = (value, btnType) => value === 1 ? btnType+'Asc' : btnType+'Des';
    
    let sortBy = "dateDes";
    switch (btnType) {
      case 'date':
        this.srtV.dateV *= -1;
        sortBy = whichSort(this.srtV.dateV, 'date');
        break;
      
      case 'distance':
        this.srtV.distanceV *= -1;
        sortBy = whichSort(this.srtV.distanceV, 'distance');
        break;
      
      case 'duration':
        this.srtV.durationV *= -1;
        sortBy = whichSort(this.srtV.durationV, 'duration');
        break;
      
      case 'speed':
        this.srtV.speedV *= -1;
        sortBy = whichSort(this.srtV.speedV, 'speed');
        break;
    
      default:
        sortBy = "dateDes";
        break;
    }

    console.log(sortBy.slice(-3))

    siblings.forEach(f => {
      if(f.dataset.type !== btnType) {
        f.querySelector('.mini').textContent = "remove";
        // f.style.backgroundColor = "#4d4642";
        f.classList.remove('selected')
      }
      else {
        f.querySelector('.mini').textContent = sortBy.slice(-3) === 'Asc' ? 'arrow_upward' : 'arrow_downward'
        // f.style.backgroundColor = "#d54f0b";
        f.classList.add('selected')
      }
    })

    // console.log(sortBy)
    this._sortWorkouts(sortBy)
  }

  _sortWorkouts(sortBy) {
    let wi = document.querySelectorAll(".workout");
    this.#workouts.sort((a, b) => {
      switch (sortBy) {
        case "dateAsc":
          return b.id - a.id;
        case "dateDes":
          return a.id - b.id;
        case "distanceAsc":
          return b.distance - a.distance;
        case "distanceDes":
          return a.distance - b.distance;
        case "durationAsc":
          return b.duration - a.duration;
        case "durationDes":
          return a.duration - b.duration;
        case "speedAsc":
          if(a.speed) return b.speed - a.speed;
          else return b.pace - a.pace;
        case "speedDes":
          if(a.speed) return a.speed - b.speed;
          else return a.pace - b.pace;
        
        default:
          return a.id - b.id;
      }
    })
    wi.forEach(e => e.remove())
    this.#workouts.forEach(wo => this._createWorkoutDescription(wo))
  }

  _workoutOperations(e){
    const clickedWorkout = e.target.closest('.workout');
    if(!clickedWorkout) return;
    const thatWorkout = this.#workouts.find(w => w.id === clickedWorkout.dataset.id);
    let thatIndex = this.#workouts.indexOf(thatWorkout)

    if(e.target.innerText === "delete") this._deleteWorkout(e, clickedWorkout, thatWorkout, thatIndex);
    // if(e.target.innerText === "edit") // editHandler
    else this._moveToPin(e, clickedWorkout, thatWorkout);
  }

  _moveToPin (e, clickedWorkout, thatWorkout) {
    this.#map.setView(thatWorkout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      }
    })
    // thatWorkout.clickAdd();
    // console.log("clicks: ", thatWorkout.clicks)
  }

  _deleteWorkout(e, clickedWorkout, thatWorkout, thatIndex) {
    this.#workouts.splice(thatIndex, 1);
    clickedWorkout.classList.add("fade");
    setTimeout(() => {
      clickedWorkout.remove();
    }, 1000);

    this.#map.removeLayer(this.#markers[thatIndex]);
    this.#markers.splice(thatIndex, 1)

    if(this.#workouts.length === 0) WelcomeInfo.classList.remove('hidden');
    this._setLocalStorage();
  }

  _deleteAll(workoutAll) {
    let title = "Delete All Workouts"
    let description = "Are sure you want to delete all workouts? This is an undoable action! "
    this._showWarningModal(title, description).then((pr) => {
      console.log("pr: ", pr)
      if(pr){
        this.#workouts = [];
        this.#markers.forEach((f, i) => this.#map.removeLayer(f));
        this.#markers = [];
        workoutAll.forEach(f => f.remove())
        WelcomeInfo.classList.remove('hidden');
        this._closeWarningModal();
      }
      else this._closeWarningModal();
    })
    

    // console.log(this.#workouts)
    // console.log(this.#markers)
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
  }

  _getLocalStorage() {
    const retrieved = JSON.parse(localStorage.getItem('workouts'));
    // console.log("retrieved: ", retrieved)

    if(!retrieved) return;
    this.#workouts = retrieved;
    this.#workouts.forEach(wo => this._createWorkoutDescription(wo))
  }

  reset() {
    localStorage.removeItem('workouts')
    location.reload();
  }
}

class Workout {
  id = (Date.now() + '').slice(-10);
  date = new Date;
  clicks = 0;

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

  clickAdd () {
    this.clicks ++;
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



