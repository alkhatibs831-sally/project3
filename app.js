let habits = JSON.parse(localStorage.getItem('habits')) || [];

const form = document.getElementById('habitForm');
const habitList = document.getElementById('habitList');
const filterHabits = document.getElementById('filterHabits');
const newDayBtn = document.getElementById('newDayBtn');

const doneTodayCountEl = document.getElementById('doneTodayCount');
const habitCountEl = document.getElementById('habitCount');
const bestStreakCountEl = document.getElementById('bestStreakCount');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) {
    errorEl.textContent = message;
  }
  if (field) {
    field.classList.toggle('is-invalid-field', message !== '');
  }
}

function validateForm() {
  let valid = true;

  const nameInput = document.getElementById('habitName');
  const name = nameInput.value.trim();
  const isDuplicate = habits.some(h => h.name.toLowerCase() === name.toLowerCase());

  if (name.length < 3) {
    showError('habitName', 'Habit name must have at least 3 letters');
    valid = false;
  } else if (isDuplicate) {
    showError('habitName', 'This habit is already in your list');
    valid = false;
  } else {
    showError('habitName', '');
  }

  const category = document.getElementById('habitCategory').value;
  if (category === '') {
    showError('habitCategory', 'Please choose a category');
    valid = false;
  } else {
    showError('habitCategory', '');
  }

  return valid;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveToLocalStorage() {
  localStorage.setItem('habits', JSON.stringify(habits));
}

function getVisibleHabits() {
  const filter = filterHabits.value;

  return habits.filter(h => {
    if (filter === 'done') return h.doneToday;
    if (filter === 'not-done') return !h.doneToday;
    return true; // all
  });
}

function renderHabits() {
  const visible = getVisibleHabits();

  if (visible.length === 0) {
    const message = habits.length === 0 ? 'No habits yet' : 'No habits found for this filter';
    habitList.innerHTML = `<div class="col-12"><div class="empty-msg">${message}</div></div>`;
    return;
  }

  habitList.innerHTML = visible.map(h => `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card habit-card ${h.doneToday ? 'done' : ''}">
        <div class="card-body">
          <h5 class="habit-title">${escapeHtml(h.name)}</h5>
          <span class="habit-category">${escapeHtml(h.category)}</span>
          <div class="habit-streak">🔥 Current Streak: <strong>${h.streak}</strong> | Best: <strong>${h.bestStreak || h.streak}</strong></div>
          <div class="d-flex gap-2">
            <button class="btn-done ${h.doneToday ? 'is-done' : ''}" data-id="${h.id}">
              ${h.doneToday ? 'Done today ✓ (Undo)' : 'Done today'}
            </button>
            <button class="btn-delete" data-id="${h.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateCards() {
  const total = habits.length;
  const doneToday = habits.filter(h => h.doneToday).length;
  
  let bestStreak = 0;
  habits.forEach(h => {
    const currentBest = Math.max(h.streak, h.bestStreak || 0);
    if (currentBest > bestStreak) {
      bestStreak = currentBest;
    }
  });

  doneTodayCountEl.textContent = `${doneToday}/${total}`;
  habitCountEl.textContent = total;
  bestStreakCountEl.textContent = bestStreak;

  const progressPercent = total > 0 ? Math.round((doneToday / total) * 100) : 0;
  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `${progressPercent}%`;
}

function render() {
  renderHabits();
  updateCards();
  saveToLocalStorage();
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const habit = {
    id: Date.now(),
    name: document.getElementById('habitName').value.trim(),
    category: document.getElementById('habitCategory').value,
    streak: 0,
    bestStreak: 0,
    doneToday: false
  };

  habits.push(habit);
  form.reset();
  render();
});

habitList.addEventListener('click', function (e) {
  const doneBtn = e.target.closest('.btn-done');
  const deleteBtn = e.target.closest('.btn-delete');

  if (doneBtn) {
    const id = Number(doneBtn.dataset.id);
    const habit = habits.find(h => h.id === id);
    if (habit) {
      if (!habit.doneToday) {
        
        habit.doneToday = true;
        habit.streak += 1;
        if (habit.streak > (habit.bestStreak || 0)) {
          habit.bestStreak = habit.streak;
        }
      } else {

        habit.doneToday = false;
        habit.streak = Math.max(0, habit.streak - 1);
      }
      render();
    }
  }

  if (deleteBtn) {
    if (confirm('Are you sure you want to delete this habit?')) {
      const id = Number(deleteBtn.dataset.id);
      habits = habits.filter(h => h.id !== id);
      render();
    }
  }
});

if (newDayBtn) {
  newDayBtn.addEventListener('click', function () {
    if (confirm('Start a new day? Habits not done today will reset their streak to 0.')) {
      habits.forEach(h => {
        if (!h.doneToday) {
          h.streak = 0; 
        }
        h.doneToday = false; 
      });
      render();
    }
  });
}

filterHabits.addEventListener('change', renderHabits);

render();