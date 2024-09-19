let timerInterval;
let currentPhase = 0;
let currentCycle = 1;
let currentReps = 0;

function startTimer(mode) {
  // Clear any existing timers and reset state
  clearInterval(timerInterval);
  currentPhase = 0;
  currentCycle = 1;
  currentReps = 0;

  let workoutConfig;

  switch (mode) {
    case '3x12':
      workoutConfig = { cycles: 3, reps: 12, breakDuration: 45 };
      break;
    case '2xLong1xSemi':
      workoutConfig = { cycles: 2, reps: 12, breakDuration: 45 };
      break;
    case '2xSemi1xLong':
      workoutConfig = { cycles: 2, reps: [6, 12], breakDuration: 45 };
      break;
    default:
      console.log("Invalid mode selected");
      return;
  }

  runWorkout(workoutConfig);
}

function runWorkout(config) {
  let isSemiLong = Array.isArray(config.reps);
  
  function nextPhase() {
    if (currentCycle > config.cycles) {
      clearInterval(timerInterval);
      document.body.className = '';
      document.getElementById('countdown').innerText = "DONE!";
      return;
    }

    if (currentReps < (isSemiLong && currentCycle === 2 ? config.reps[1] : config.reps)) {
      // Reps (5 seconds per rep, 2-second break in between)
      startPhase(5, 'green', `Rep ${currentReps + 1}/${config.reps}`, nextPhase);
      currentReps++;
    } else if (currentReps === config.reps) {
      // Long break between cycles (45 seconds)
      startPhase(config.breakDuration, 'yellow', 'Long Break', () => {
        currentReps = 0;
        currentCycle++;
        nextPhase();
      });
    } 
  }

  nextPhase();
}

function startPhase(duration, colorClass, label, callback) {
  document.body.className = colorClass;
  let timeLeft = duration;
  document.getElementById('countdown').innerText = formatTime(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('countdown').innerText = formatTime(timeLeft);

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      callback();
    }
  }, 1000);
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
