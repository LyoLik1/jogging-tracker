'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');
const removeAllItem = document.querySelector('.remove--all--item');
const removeCertainItem = document.querySelector('.remove--certain--item');
const sortedButton = document.querySelector('.list');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clickNumber = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }

  _setDescription() {
    this.type === 'running'
      ? (this.discription = `Jog ${new Intl.DateTimeFormat('ua-En').format(
          this.date
        )}`)
      : (this.discription = `Cycling ${new Intl.DateTimeFormat('ua-En').format(
          this.date
        )}`);
  }

  click() {
    this.clickNumber++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.caclulatePace();
    this._setDescription();
  }

  caclulatePace() {
    // min/km
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.caclulateSpeed();
    this._setDescription();
  }

  caclulateSpeed() {
    // km/h
    this.speed = (this.distance / this.duration) * 60;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //Get posotion of user
    this._getPosition();

    // Get data of local storage
    this._getLocalStorageData();

    //Add event listener
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleClimbFields);
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    removeAllItem.addEventListener('click', this._reset);
    sortedButton.addEventListener('click', this._sorted.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Impossible to get your location');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Processing of clicking in map
    this.#map.on('click', this._showForm.bind(this));

    // Display training from local storage on map
    this.#workouts.forEach((workout) => {
      this._displayWorkout(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputTemp.value =
      inputClimb.value =
        '';
    form.classList.add('hidden');
  }

  _toggleClimbFields() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const areNumbers = (...numbers) =>
      numbers.every((num) => Number.isFinite(num));

    const arePositiveNumbers = (...numbers) => numbers.every((num) => num > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Get date from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (type === 'running') {
      const temp = +inputTemp.value;
      if (
        !areNumbers(distance, duration, temp) ||
        !arePositiveNumbers(distance, duration, temp)
      )
        return alert('Enter a positive number!');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    if (type === 'cycling') {
      const climb = +inputClimb.value;
      if (
        !areNumbers(distance, duration, climb) ||
        !arePositiveNumbers(distance, duration)
      )
        return alert('Enter a positive number!');
      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    this.#workouts.push(workout);

    // Display training on map

    this._displayWorkout(workout);

    // Display training in list

    this._displayWorkoutOnSidebar(workout);

    // Hide form and clearing input

    this._hideForm();

    // Add all training in local storage
    this._addWorkoutsToLocalStorage();
  }

  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.discription}`
      )
      .openPopup();
  }

  _displayWorkoutOnSidebar(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚵‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟⏱</span>
            <span class="workout__value">${workout.temp}</span>
            <span class="workout__unit">step/min</span>
          </div>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🏔</span>
            <span class="workout__value">${workout.climb}</span>
            <span class="workout__unit">m</span>
          </div>
      </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    // console.log(workoutElement);

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      (item) => item.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _addWorkoutsToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorageData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((workout) => {
      this._displayWorkoutOnSidebar(workout);
    });
  }

  _reset(e) {
    e.preventDefault();
    localStorage.removeItem('workouts');
    location.reload();
  }

  _deleteOldTrainAndAddNew(type) {
    const arr = document.querySelectorAll('.workout');
    for (const train of arr) {
      train.remove();
    }
    console.log(arr);
    type.forEach((sortTrain) => this._displayWorkoutOnSidebar(sortTrain));
  }

  _sorted() {
    if (!sortedButton.classList.contains('sorted')) {
      const sort = this.#workouts
        .slice()
        .sort((a, b) => a.distance - b.distance);

      this._deleteOldTrainAndAddNew(sort);

      sortedButton.classList.add('sorted');
    } else {
      const noSort = this.#workouts.slice();

      this._deleteOldTrainAndAddNew(noSort);

      sortedButton.classList.remove('sorted');
    }
  }
}

const app = new App();
