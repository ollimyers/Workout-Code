let timerInterval;
let totalTime = 0; // Total time for the workout
let timeElapsed = 0; // Time elapsed for the progress bar

function startTimer(mode) {
  // Clear any existing timers and reset
  clearInterval(timerInterval);
  document.body.className = '';
  document.getElementById('countdown').innerText = '';
  timeElapsed = 0;
  document.getElementById('progress').style.width = '0%'; // Reset progress bar

  // Workout configurations
  let workoutConfig;

  switch (mode) {
    case '3x12':
      workoutConfig = { cycles: 3, repsPerCycle: 12, isSemiLong: false };
      break;
    case '2xLong1xSemi':
      workoutConfig = { cycles: 2, repsPerCycle: 12, isSemiLong: false };
      break;
    case '2xSemi1xLong':
      workoutConfig = { cycles: [6, 12], isSemiLong: true };
      break;
    default:
      console.log("Invalid mode selected");
      return;
  }

  // Calculate total workout time for the progress bar
  calculateTotalTime(workoutConfig);
  
  // Start the workout
  runWorkout(workoutConfig);
}

function calculateTotalTime(config) {
  let totalReps = 0;
  if (config.isSemiLong) {
    totalReps = config.cycles[0] * 7 + config.cycles[1] * 7; // 5 sec rep + 2 sec break per rep
    totalTime = totalReps + 2 * 45; // 45 sec break between cycles
  } else {
    totalReps = config.cycles * config.repsPerCycle * 7;
    totalTime = totalReps + (config.cycles - 1) * 45; // Long break only between cycles
  }
}

function runWorkout(config) {
  let currentCycle = 0;
  let totalCycles = config.isSemiLong ? config.cycles.length : config.cycles;
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

    // Handle reps within the current cycle
    if (currentRep < totalReps) {
      startRep(5, 'green', `Rep ${currentRep + 1}/${totalReps}`, () => {
        // After rep, start a short break (2 seconds)
        startBreak(2, 'red', 'Short Break', () => {
          currentRep++;
          nextPhase();  // Move to the next rep or phase
        });
      });
    } else {
      // After all reps, take a long break (45 seconds) except at the last cycle
      if (currentCycle < totalCycles - 1) {
        startBreak(45, 'yellow', 'Long Break', () => {
          currentCycle++;
          currentRep = 0;
          totalReps = config.isSemiLong ? config.cycles[currentCycle] : config.repsPerCycle;  // Adjust reps for the next cycle
          nextPhase();  // Move to the next cycle
        });
      } else {
        // No long break after the final cycle
        currentCycle++;
        currentRep = 0;
        nextPhase();
      }
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
  document.getElementById('countdown').style.visibility = 'visible'; // Ensure visibility

  let timeLeft = duration;
  timerInterval = setInterval(() => {
    document.getElementById('countdown').innerText = formatTime(timeLeft);
    timeLeft--;
    updateProgress(duration);  // Update progress bar

    if (timeLeft < 0) {
      clearInterval(timerInterval);  // Clear the current timer
      callback();  // Move to the next phase when time is up
    }
  }, 1000);
}

function updateProgress(phaseDuration) {
  timeElapsed += 1;
  const progressPercentage = (timeElapsed / totalTime) * 100;
  document.getElementById('progress').style.width = `${progressPercentage}%`;
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
