let timerInterval;
let totalTime = 0;
let timeElapsed = 0;
let paused = false;
let timeLeftGlobal = 0;
let currentPhaseCallback;
let preWorkoutBreak = 5; // 5-second break before workout

// Workout configurations
const workoutModes = {
  '3x12': { cycles: 3, repsPerCycle: 12, cycleBreak: 45 },
  '2xLong1xSemi': { cycles: 2, repsPerCycle: 12, cycleBreak: 45 },
  '2xSemi1xLong': { cycles: [6, 12], cycleBreak: 45 }
};

// Sounds for different phases
const repSound = new Audio('ding.mp3'); // Single ding sound
const miniBreakSound = new Audio('double-ding.mp3'); // Double ding sound
const longBreakSound = new Audio('long-ding.mp3'); // Long ding sound

// State variables for phases
let currentCycle = 0;
let currentRep = 0;
let config = {};
let totalCycles = 0;

function startTimer(mode) {
  clearInterval(timerInterval);  // Clear any existing timers
  document.body.className = '';  // Reset background color
  document.getElementById('countdown').innerText = '00:00';  // Reset countdown
  document.getElementById('progress').style.width = '0%';  // Reset progress bar
  document.getElementById('counter').innerText = 'Rep 0/0, Set 0/0';  // Reset counter
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

  // Start 5-second pre-workout countdown
  startPreWorkoutBreak();
}

function calculateTotalTime(config) {
  if (Array.isArray(config.cycles)) {
    totalTime = (config.cycles[0] * 7) + (config.cycles[1] * 7) + (config.cycleBreak);  // Total time in seconds
  } else {
    totalTime = (config.cycles * config.repsPerCycle * 7) + ((config.cycles - 1) * config.cycleBreak);
  }

  // Add the pre-workout break to the total time
  totalTime += preWorkoutBreak;
}

function startPreWorkoutBreak() {
  document.body.className = 'yellow';  // Use the long break color
  document.getElementById('countdown').innerText = formatTime(preWorkoutBreak);
  
  timeLeftGlobal = preWorkoutBreak;

  timerInterval = setInterval(() => {
    if (!paused) {
      document.getElementById('countdown').innerText = formatTime(timeLeftGlobal);
      timeLeftGlobal--;

      if (timeLeftGlobal < 0) {
        clearInterval(timerInterval);
        runWorkout(config);  // Start the actual workout after the pre-workout break
      }
    }
  }, 1000);
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
    // Update the counter with correct reps and sets
    updateCounter(currentRep + 1, totalReps, currentCycle + 1, totalCycles);

    // Start rep phase
    startPhase(5, 'red', `Rep ${currentRep + 1}/${totalReps}`, () => {
      // Play single ding sound
      repSound.play();

      startPhase(2, 'green', 'Mini Break', () => {
        // Play double ding sound
        miniBreakSound.play();

        currentRep++;
        nextPhase();  // Go to next phase
      });
    });
  } else {
    if (currentCycle < totalCycles - 1) {
      // Start long break after cycle
      startPhase(config.cycleBreak, 'yellow', 'Long Break', () => {
        // Play long ding sound
        longBreakSound.play();

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
  timeElapsed -= 7;  // Rewind time for the last rep/break duration (5+2 seconds)

  if (currentRep > 0) {
    // Move back to the previous rep
    currentRep--;
  } else if (currentCycle > 0) {
    // Move to the last rep of the previous cycle
    currentCycle--;
    currentRep = Array.isArray(config.cycles) ? config.cycles[currentCycle] - 1 : config.repsPerCycle - 1;
  }

  nextPhase();  // Restart the current phase
}

function updateProgress(seconds) {
  timeElapsed += seconds;  // Update elapsed time by seconds
  const progressPercentage = (timeElapsed / totalTime) * 100;

  if (progressPercentage <= 100) {
    document.getElementById('progress').style.width = `${progressPercentage}%`;
  }
}

function updateCounter(rep, totalReps, cycle, totalCycles) {
  document.getElementById('counter').innerText = `Rep ${rep}/${totalReps}, Set ${cycle}/${totalCycles}`;
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
