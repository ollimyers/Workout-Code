let timerInterval;
let totalTime = 0;
let timeElapsed = 0;

// Workout configurations
const workoutModes = {
  '3x12': { cycles: 3, repsPerCycle: 12, cycleBreak: 45 },
  '2xLong1xSemi': { cycles: 2, repsPerCycle: 12, cycleBreak: 45 },
  '2xSemi1xLong': { cycles: [6, 12], cycleBreak: 45 }
};

function startTimer(mode) {
  clearInterval(timerInterval);
  document.body.className = '';
  document.getElementById('countdown').innerText = '';
  document.getElementById('progress').style.width = '0%';

  timeElapsed = 0;  // Reset progress

  const config = workoutModes[mode];

  if (!config) {
    console.log("Invalid mode selected");
    return;
  }

  // Calculate total workout time
  calculateTotalTime(config);
  
  // Start workout sequence
  runWorkout(config);
}

function calculateTotalTime(config) {
  if (Array.isArray(config.cycles)) {
    totalTime = config.cycles[0] * 7 + config.cycles[1] * 7 + config.cycleBreak;  // 7 seconds per rep/break
  } else {
    totalTime = config.cycles * config.repsPerCycle * 7 + (config.cycles - 1) * config.cycleBreak;
  }
}

function runWorkout(config) {
  let currentCycle = 0;
  let currentRep = 0;
  let totalCycles = Array.isArray(config.cycles) ? config.cycles.length : config.cycles;

  function nextPhase() {
    // End workout after all cycles
    if (currentCycle >= totalCycles) {
      clearInterval(timerInterval);
      document.getElementById('countdown').innerText = "DONE!";
      document.body.className = '';
      return;
    }

    let totalReps = Array.isArray(config.cycles) ? config.cycles[currentCycle] : config.repsPerCycle;

    if (currentRep < totalReps) {
      // Start rep phase
      startPhase(5, 'green', `Rep ${currentRep + 1}/${totalReps}`, () => {
        // Start short break after each rep
        startPhase(2, 'red', 'Short Break', () => {
          currentRep++;
          nextPhase();
        });
      });
    } else {
      // If last cycle, skip the long break
      if (currentCycle < totalCycles - 1) {
        // Start long break after a cycle
        startPhase(config.cycleBreak, 'yellow', 'Long Break', () => {
          currentCycle++;
          currentRep = 0;  // Reset reps for the next cycle
          nextPhase();
        });
      } else {
        // Move directly to the next cycle without a long break
        currentCycle++;
        currentRep = 0;
        nextPhase();
      }
    }
  }

  nextPhase();  // Start first phase
}

function startPhase(duration, colorClass, label, callback) {
  clearInterval(timerInterval);
  document.body.className = colorClass;
  document.getElementById('countdown').innerText = formatTime(duration);
  document.getElementById('countdown').style.visibility = 'visible'; // Ensure timer text is visible

  let timeLeft = duration;
  timerInterval = setInterval(() => {
    document.getElementById('countdown').innerText = formatTime(timeLeft);
    updateProgress(duration);

    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      callback();
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
