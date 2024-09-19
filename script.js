let timerInterval;
let progressInterval;

function startTimer(mode) {
  clearInterval(timerInterval);
  clearInterval(progressInterval);
  
  let cycles, shortReps, longReps;
  
  switch (mode) {
    case '3x12':
      cycles = 3;
      shortReps = 12;
      longReps = 12;
      runTimer(cycles, shortReps, longReps);
      break;
    case '2xLong1xSemi':
      cycles = 2;
      shortReps = 12;
      longReps = 12;
      runTimer(cycles, shortReps, longReps);
      break;
    case '2xSemi1xLong':
      cycles = 2;
      shortReps = 6;
      longReps = 12;
      runTimer(cycles, shortReps, longReps);
      break;
  }
}

function runTimer(cycles, shortReps, longReps) {
  let totalTime = (shortReps + longReps) * cycles * 7 + 45 * (cycles - 1); // Adjust based on total workout time.
  let remainingTime = totalTime;
  
  let currentCycle = 1;
  let currentRep = 0;
  
  function updateProgress() {
    let progress = ((totalTime - remainingTime) / totalTime) * 100;
    document.getElementById('progress').style.width = progress + '%';
  }
  
  function nextAction() {
    if (currentCycle > cycles) {
      clearInterval(timerInterval);
      document.body.className = '';
      return;
    }
    
    if (currentRep < shortReps) {
      // Short Reps
      startRep(5, 'green', 'Short Rep');
      currentRep++;
    } else if (currentRep < longReps) {
      // Long Reps
      startRep(5, 'green', 'Long Rep');
      currentRep++;
    } else {
      // Breaks between cycles
      startBreak(45, 'yellow', 'Cycle Break');
      currentCycle++;
      currentRep = 0;
    }
  }
  
  nextAction();
  
  timerInterval = setInterval(() => {
    remainingTime--;
    updateProgress();
    nextAction();
  }, 1000);
}

function startRep(duration, colorClass, label) {
  let timeLeft = duration;
  document.body.className = colorClass;
  document.getElementById('countdown').innerText = formatTime(timeLeft);
  
  let repInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('countdown').innerText = formatTime(timeLeft);
    if (timeLeft <= 0) clearInterval(repInterval);
  }, 1000);
}

function startBreak(duration, colorClass, label) {
  let timeLeft = duration;
  document.body.className = colorClass;
  document.getElementById('countdown').innerText = formatTime(timeLeft);
  
  let breakInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('countdown').innerText = formatTime(timeLeft);
    if (timeLeft <= 0) clearInterval(breakInterval);
  }, 1000);
}

function formatTime(seconds) {
  let min = Math.floor(seconds / 60);
  let sec = seconds % 60;
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}
