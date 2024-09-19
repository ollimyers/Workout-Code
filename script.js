let timerInterval;
let totalTime = 0;
let timeElapsed = 0;
let paused = false;
let timeLeftGlobal = 0;
let currentPhaseCallback;

// Workout configurations
const workoutModes = {
  '3x12': { cycles: 3, repsPerCycle: 12, cycleBreak: 45 },
  '2xLong1xSemi': { cycles: 2, repsPerCycle: 12, cycleBreak: 45 },
  '2xSemi1xLong': { cycles: [6, 12], cycleBreak: 45 }
};

// State variables for phases
let currentCycle = 0;
let currentRep = 0;
let config = {};
let totalCycles = 0;

function startTimer(mode) {
  clearInterval(timerInterval);  // Clear any existing timers
  document.body.className = '';  // Reset background color
  document.getElementById('countdown').innerText = '';  // Clear countdown
  document.getElementById('progress').style.width = '0%';  // Reset progress bar
  timeElapsed = 0;  // Reset progress counter

  paused = false;
  document.getElementById('pause-btn').innerText = "Pause";

  config = workoutModes[mode];  // Get selected workout mode

  if (!config) {
    console.log("Invalid mode selected");
    return;
  }

  // Calculate total workout time for the progress bar
  calculateTotalTime(config);
  
  // Reset state variables
  currentCycle = 0;
  currentRep = 0;
  totalCycles = Array.isArray(config.cycles) ? config.cycles.length : config.cycles;

  // Start the workout
  runWorkout(config);
}

function calculateTotalTime(config) {
  if (Array.isArray(config.cycles)) {
    totalTime = (config.cycles[0] * 7) + (config.cycles[1] * 7) + (config.cycleBreak);  // Total time in seconds
  } else {
    totalTime = (config.cycles * config.repsPerCycle * 7) + ((config.cycles - 1) * config.cycleBreak);
  }
}

function runWorkout(config) {
  nextPhase();
}

function nextPhase() {
  if (currentCycle >= totalCycles) {
    // End the workout
    clearInterval(timerInterval);
    document.getElementById('countdown').innerText = "DONE!";
    document.body.className = '';
    return;
  }

  let totalReps = Array.isArray(config.cycles) ? config.cycles[currentCycle] : config.repsPerCycle;

  if (currentRep < totalReps) {
    // Start rep phase
    startPhase(5, 'green', `Rep ${currentRep + 1}/${totalReps}`, () => {
      startPhase(2, 'red', 'Short Break', () => {
        currentRep++;
        nextPhase();  // Go to next phase
      });
    });
  } else {
    if (currentCycle < totalCycles - 1) {
      // Start long break after cycle
      startPhase(config.cycleBreak, 'yellow', 'Long Break', () => {
        currentCycle++;
        currentRep = 0;
        nextPhase();  // Move to next cycle
      });
    } else {
      // No long break after last cycle
      currentCycle++;
      currentRep = 0;
      nextPhase();
    }
  }
}

function startPhase(duration, colorClass, label, callback) {
  clearInterval(timerInterval);
  document.body.className = colorClass;
  document.getElementById('countdown').innerText = formatTime(duration);
  document.getElementById('countdown').style.visibility = 'visible';

  timeLeftGlobal = duration;
  currentPhaseCallback = callback;

  timerInterval = setInterval(() => {
    if (!paused) {
      document.getElementById('countdown').innerText = formatTime(timeLeftGlobal);
      updateProgress(1);  // Update progress for each second

      timeLeftGlobal--;

      if (timeLeftGlobal < 0) {
        clearInterval(timerInterval);
        callback();
      }
    }
  }, 1000);
}

function pauseWorkout() {
  if (!paused) {
    paused = true;
    document.getElementById('pause-btn').innerText = "Resume";
  } else {
    paused = false;
    document.getElementById('pause-btn').innerText = "Pause";
  }
}

function skipPhase() {
  clearInterval(timerInterval);
  timeElapsed += timeLeftGlobal;  // Add remaining time to elapsed time
  currentPhaseCallback();  // Call the callback to move to the next phase
}

function rewindPhase() {
  clearInterval(timerInterval);
  currentRep = Math.max(currentRep - 1, 0);  // Move back a rep but not below 0
  timeElapsed -= 5;  // Subtract 5 seconds for the last rep
  nextPhase();  // Restart the current phase
}

function updateProgress(seconds) {
  timeElapsed += seconds;  // Update elapsed time by seconds
  const progressPercentage = (timeElapsed / totalTime) * 100;
  document.getElementById('progress').style.width = `${progressPercentage}%`;
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
