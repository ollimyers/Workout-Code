let timerInterval;  // This will store the active interval

function startTimer(mode) {
  // Clear any existing timers and reset the body class
  clearInterval(timerInterval);
  document.body.className = '';
  
  // Workout modes configuration
  let workoutConfig;

  switch (mode) {
    case '3x12':
      workoutConfig = { cycles: 3, repsPerCycle: 12, isSemiLong: false };
      break;
    case '2xLong1xSemi':
      workoutConfig = { cycles: 2, repsPerCycle: 12, isSemiLong: false };
      break;
    case '2xSemi1xLong':
      workoutConfig = { cycles: [6, 12], isSemiLong: true };  // First cycle has 6 reps, second has 12 reps
      break;
    default:
      console.log("Invalid mode selected");
      return;
  }

  // Start the workout
  runWorkout(workoutConfig);
}

function runWorkout(config) {
  let currentCycle = 0;
  let totalCycles = config.isSemiLong ? config.cycles.length : config.cycles;  // If semi-long, use the length of the cycles array
  let currentRep = 0;
  let totalReps = config.isSemiLong ? config.cycles[currentCycle] : config.repsPerCycle;

  function nextPhase() {
    // If we're done with all cycles, finish the workout
    if (currentCycle >= totalCycles) {
      clearInterval(timerInterval);
      document.getElementById('countdown').innerText = "DONE!";
      document.body.className = '';
      return;
    }

    // If reps are remaining in the current cycle
    if (currentRep < totalReps) {
      startRep(5, 'green', `Rep ${currentRep + 1}/${totalReps}`, () => {
        // After rep, start a short break
        startBreak(2, 'red', 'Short Break', () => {
          currentRep++;
          nextPhase();  // Move to the next rep or phase
        });
      });
    } else {
      // After finishing the reps, do a long break and move to the next cycle
      startBreak(45, 'yellow', 'Cycle Break', () => {
        currentCycle++;
        currentRep = 0;
        totalReps = config.isSemiLong ? config.cycles[currentCycle] : config.repsPerCycle;  // Update reps for the new cycle
        nextPhase();  // Move to the next cycle
      });
    }
  }

  nextPhase();  // Start the first phase (rep or break)
}

function startRep(duration, colorClass, label, callback) {
  runPhase(duration, colorClass, label, callback);
}

function startBreak(duration, colorClass, label, callback) {
  runPhase(duration, colorClass, label, callback);
}

function runPhase(duration, colorClass, label, callback) {
  clearInterval(timerInterval);  // Clear any previous timer
  document.body.className = colorClass;  // Set the background color
  document.getElementById('countdown').innerText = formatTime(duration);

  let timeLeft = duration;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('countdown').innerText = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);  // Clear the current timer
      callback();  // Move to the next phase when time is up
    }
  }, 1000);
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
