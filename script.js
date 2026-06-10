let timerInterval;
let totalTime = 0;
let timeElapsed = 0;
let paused = false;
let timeLeftGlobal = 0;
let currentPhaseCallback;
let preWorkoutBreak = 5; // 5-second break before workout
let wakeLock = null; // Wake Lock reference
let customTimerDuration = 0; // Duration for the custom timer
let phaseEndTime = null;
let pausedAt = null;
let audioPrimed = false;

// Extend workoutModes to include a 'Standard Timer' mode
const workoutModes = {
  '3x12': { cycles: 3, repsPerCycle: 12, cycleBreak: 45 },
  '2xLong1xSemi': { cycles: 2, repsPerCycle: 12, cycleBreak: 45 },
  '2xSemi1xLong': { cycles: [6, 12, 12], cycleBreak: 45 },
  'StandardTimer': { custom: true } // New mode for standard timers
};

// Sounds for different phases
const repSound = new Audio('ding.mp3'); // Single ding sound
const miniBreakSound = new Audio('double-ding.mp3'); // Double ding sound
const longBreakSound = new Audio('long-ding.mp3'); // Long ding sound

[repSound, miniBreakSound, longBreakSound].forEach((sound) => {
  sound.preload = 'auto';
});

// State variables for phases
let currentCycle = 0;
let currentRep = 0;
let config = {};
let totalCycles = 0;

function setAmbientAudioSession() {
  try {
    if (navigator.audioSession && typeof navigator.audioSession.type === 'string') {
      navigator.audioSession.type = 'ambient';
    }
  } catch (err) {
    console.warn('Could not set audio session type:', err);
  }
}

function primeAudio() {
  if (audioPrimed) {
    return;
  }

  audioPrimed = true;
  setAmbientAudioSession();

  [repSound, miniBreakSound, longBreakSound].forEach((sound) => {
    sound.muted = true;
    const playAttempt = sound.play();
    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt
        .then(() => {
          sound.pause();
          sound.currentTime = 0;
          sound.muted = false;
        })
        .catch(() => {
          sound.muted = false;
        });
    } else {
      sound.muted = false;
    }
  });
}

function playSound(sound) {
  if (!sound) {
    return;
  }

  sound.currentTime = 0;
  const playAttempt = sound.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch((err) => {
      console.warn('Sound playback was blocked:', err);
    });
  }
}

function getRemainingSeconds() {
  if (phaseEndTime === null) {
    return timeLeftGlobal;
  }

  return Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000));
}

function finishTimer() {
  clearInterval(timerInterval);
  phaseEndTime = null;
  pausedAt = null;
  currentPhaseCallback = null;
  document.getElementById('countdown').innerText = 'DONE!';
  document.body.className = '';
  releaseWakeLock();
}

async function requestWakeLock() {
  if (wakeLock) {
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake lock is active.');
  } catch (err) {
    console.error('Failed to request wake lock:', err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().then(() => {
      console.log('Wake lock released.');
      wakeLock = null;
    });
  }
}

function startStandardTimer(duration) {
  primeAudio();
  requestWakeLock();

  // Reset previous state
  clearInterval(timerInterval);
  phaseEndTime = null;
  pausedAt = null;
  currentPhaseCallback = null;
  document.body.className = ''; // Reset background color
  document.getElementById('countdown').innerText = formatTime(duration); // Display initial duration
  document.getElementById('progress').style.width = '0%'; // Reset progress bar

  timeElapsed = 0; // Reset progress counter
  paused = false;
  customTimerDuration = duration; // Set the custom timer duration
  totalTime = duration; // Set totalTime for progress tracking

  // Start the timer
  timeLeftGlobal = duration;
  phaseEndTime = Date.now() + (duration * 1000);
  currentPhaseCallback = () => {
    finishTimer();
    playSound(longBreakSound);
  };

  timerInterval = setInterval(() => {
    if (!paused) {
      const remaining = getRemainingSeconds();
      const elapsedThisTick = Math.max(0, timeLeftGlobal - remaining);
      if (elapsedThisTick > 0) {
        updateProgress(elapsedThisTick); // Update progress bar
      }

      timeLeftGlobal = remaining;
      document.getElementById('countdown').innerText = formatTime(timeLeftGlobal);

      if (timeLeftGlobal <= 0) {
        currentPhaseCallback();
      }
    }
  }, 250);
}

function startTimer(mode, customDuration = 0) {
  primeAudio();

  if (mode === 'StandardTimer') {
    // Start the custom timer with the specified duration
    startStandardTimer(customDuration);
    return;
  }
  clearInterval(timerInterval);  // Clear any existing timers
  phaseEndTime = null;
  pausedAt = null;
  currentPhaseCallback = null;
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

  // Request Wake Lock
  requestWakeLock();

  // Calculate total workout time for the progress bar
  calculateTotalTime(config);

  // Reset state variables
  currentCycle = 0;
  currentRep = 0;
  totalCycles = Array.isArray(config.cycles) ? config.cycles.length : config.cycles;

  // Start 5-second pre-workout countdown
  startPreWorkoutBreak();
}

function handleStartCustomTimer() {
  const durationInput = document.getElementById('timer-duration').value;
  const duration = parseInt(durationInput, 10);

  if (isNaN(duration) || duration <= 0) {
    // Highlight the input field if the value is invalid
    const inputField = document.getElementById('timer-duration');
    inputField.style.borderColor = 'red';
    inputField.style.boxShadow = '0 0 5px red';
    setTimeout(() => {
      inputField.style.borderColor = '#ccc';
      inputField.style.boxShadow = 'none';
    }, 2000);
    alert("Please enter a valid duration in seconds.");
    return;
  }

  // Reset the input styling if the value is valid
  document.getElementById('timer-duration').style.borderColor = '#ccc';
  document.getElementById('timer-duration').style.boxShadow = 'none';

  // Start the timer
  startTimer('StandardTimer', duration);

  // Provide feedback that the timer has started
  const customTimerDiv = document.getElementById('custom-timer');
  customTimerDiv.style.backgroundColor = '#d4edda'; // Light green background
  setTimeout(() => {
    customTimerDiv.style.backgroundColor = '#f9f9f9'; // Reset to original color
  }, 1000);
}


function calculateTotalTime(config) {
  if (Array.isArray(config.cycles)) {
    // Custom cycles: sum reps and add breaks
    totalTime = config.cycles.reduce((sum, reps) => sum + reps * 7, 0) + (config.cycles.length - 1) * config.cycleBreak;
  } else {
    // Standard cycles
    totalTime = (config.cycles * config.repsPerCycle * 7) + ((config.cycles - 1) * config.cycleBreak);
  }

  // Add the pre-workout break to the total time
  totalTime += preWorkoutBreak;
}


function startPreWorkoutBreak() {
  document.body.className = 'yellow'; // Use the long break color
  document.getElementById('countdown').innerText = formatTime(preWorkoutBreak);

  timeLeftGlobal = preWorkoutBreak;
  phaseEndTime = Date.now() + (preWorkoutBreak * 1000);
  currentPhaseCallback = () => {
    clearInterval(timerInterval);
    phaseEndTime = null;
    runWorkout(config);
  };

  timerInterval = setInterval(() => {
    if (!paused) {
      const remaining = getRemainingSeconds();
      const elapsedThisTick = Math.max(0, timeLeftGlobal - remaining);
      if (elapsedThisTick > 0) {
        updateProgress(elapsedThisTick);
      }

      timeLeftGlobal = remaining;
      document.getElementById('countdown').innerText = formatTime(timeLeftGlobal);

      if (timeLeftGlobal <= 0) {
        currentPhaseCallback();
      }
    }
  }, 250);
}


function runWorkout(config) {
  nextPhase();
}

function nextPhase() {
  if (currentCycle >= totalCycles) {
    // End the workout
    finishTimer();
    return;
  }

  let totalReps = Array.isArray(config.cycles) ? config.cycles[currentCycle] : config.repsPerCycle;

  if (currentRep < totalReps) {
    // Start rep phase
    updateCounter(currentRep + 1, totalReps, currentCycle + 1, totalCycles);

    startPhase(5, 'red', `Rep ${currentRep + 1}/${totalReps}`, () => {
      startPhase(2, 'green', 'Mini Break', () => {
        currentRep++;
        nextPhase(); // Go to next rep or cycle
      });
    });
  } else {
    if (currentCycle < totalCycles - 1) {
      // Long break after each cycle (except the last)
      startPhase(config.cycleBreak, 'yellow', 'Long Break', () => {
        currentCycle++;
        currentRep = 0;
        nextPhase(); // Move to next cycle
      });
    } else {
      // Final transition after last cycle
      currentCycle++;
      currentRep = 0;
      nextPhase();
    }
  }
}





function startPhase(duration, colorClass, label, callback) {
  clearInterval(timerInterval); // Clear any existing intervals
  document.body.className = colorClass; // Set background color
  document.getElementById('countdown').innerText = formatTime(duration); // Display timer
  document.getElementById('countdown').style.visibility = 'visible';

  timeLeftGlobal = duration; // Set the time for this phase
  phaseEndTime = Date.now() + (duration * 1000);
  currentPhaseCallback = callback; // Save the callback for the phase transition

  timerInterval = setInterval(() => {
    if (!paused) {
      const remaining = getRemainingSeconds();
      const elapsedThisTick = Math.max(0, timeLeftGlobal - remaining);
      if (elapsedThisTick > 0) {
        updateProgress(elapsedThisTick); // Update progress bar
      }

      timeLeftGlobal = remaining;
      document.getElementById('countdown').innerText = formatTime(timeLeftGlobal); // Update display

      if (timeLeftGlobal <= 0) {
        // Play the appropriate sound (only at the end of the phase)
        if (label.startsWith("Rep")) {
          playSound(repSound);
        } else if (label === "Mini Break") {
          playSound(miniBreakSound);
        } else if (label === "Long Break") {
          playSound(longBreakSound);
        }

        phaseEndTime = null;
        clearInterval(timerInterval); // Clear the timer
        callback(); // Trigger the next phase
      }
    }
  }, 250);
}


function pauseWorkout() {
  if (!paused) {
    paused = true;
    pausedAt = Date.now();
    document.getElementById('pause-btn').innerText = "Resume";
  } else {
    paused = false;
    if (phaseEndTime !== null && pausedAt !== null) {
      phaseEndTime += Date.now() - pausedAt;
    }
    pausedAt = null;
    document.getElementById('pause-btn').innerText = "Pause";
  }
}

function skipPhase() {
  clearInterval(timerInterval);
  if (timeLeftGlobal > 0) {
    updateProgress(timeLeftGlobal);
  }
  phaseEndTime = null;

  if (typeof currentPhaseCallback === 'function') {
    currentPhaseCallback();
  } else {
    finishTimer();
  }
}

function rewindPhase() {
  if (!config || Object.keys(config).length === 0) {
    return;
  }

  clearInterval(timerInterval);
  phaseEndTime = null;
  timeElapsed = Math.max(0, timeElapsed - 7); // Rewind progress for one rep + mini break
  updateProgress(0);

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
  if (totalTime <= 0) {
    document.getElementById('progress').style.width = '0%';
    return;
  }

  const progressPercentage = (timeElapsed / totalTime) * 100;

  if (progressPercentage <= 100) {
    document.getElementById('progress').style.width = `${progressPercentage}%`;
  } else {
    document.getElementById('progress').style.width = '100%';
  }
}

function updateCounter(rep, totalReps, cycle, totalCycles) {
  document.getElementById('counter').innerText = `Rep ${rep}/${totalReps}, Set ${cycle}/${totalCycles}`;
}

function formatTime(seconds) {
  if (seconds < 0) {
    seconds = 0;
  }

  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeLock === null && !paused && timeLeftGlobal > 0) {
    requestWakeLock();
  }

  if (!paused && phaseEndTime !== null) {
    const remaining = getRemainingSeconds();
    timeLeftGlobal = remaining;
    document.getElementById('countdown').innerText = formatTime(remaining);
  }
});

document.addEventListener('click', primeAudio, { once: true });
document.addEventListener('touchstart', primeAudio, { once: true });
