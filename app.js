(() => {
  const syllables = ["RA", "RE", "RI", "RO", "RU"];
  const words = ["rana", "ratón", "rueda", "perro", "torre"];
  const tones = ["#e9896d", "#d9a83e", "#70a98b", "#6799bd", "#9b7bb5"];
  const syllableRow = document.querySelector("#syllableRow");
  const promptLabel = document.querySelector("#promptLabel");
  const prompt = document.querySelector("#prompt");
  const listenPrompt = document.querySelector("#listenPrompt");
  const recordButton = document.querySelector("#recordButton");
  const playbackButton = document.querySelector("#playbackButton");
  const recordStatus = document.querySelector("#recordStatus");
  const recording = document.querySelector("#myRecording");
  const nextPrompt = document.querySelector("#nextPrompt");
  const practiceTab = document.querySelector("#practiceTab");
  const gameTab = document.querySelector("#gameTab");
  const practicePanel = document.querySelector("#practicePanel");
  const gamePanel = document.querySelector("#gamePanel");
  const playQuestion = document.querySelector("#playQuestion");
  const gameChoices = document.querySelector("#gameChoices");
  const gameFeedback = document.querySelector("#gameFeedback");
  const stars = document.querySelector("#stars");
  let promptIndex = 0;
  let question = syllables[0];
  let earnedStars = 0;
  let recorder = null;
  let recordedParts = [];
  let recordingTimer = null;

  function say(text, rate = 0.76) {
    if (!("speechSynthesis" in window)) {
      recordStatus.textContent = "El sonido no está disponible en este navegador.";
      recordStatus.className = "record-status error";
      return;
    }
    window.speechSynthesis.cancel();
    const voiceLine = new SpeechSynthesisUtterance(text);
    voiceLine.lang = "es-ES";
    voiceLine.rate = rate;
    voiceLine.pitch = 1.05;
    const spanishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("es"));
    if (spanishVoice) voiceLine.voice = spanishVoice;
    window.speechSynthesis.speak(voiceLine);
  }

  syllables.forEach((syllable, index) => {
    const button = document.createElement("button");
    button.className = "syllable-button";
    button.type = "button";
    button.textContent = syllable;
    button.style.setProperty("--tone", tones[index]);
    button.setAttribute("aria-label", `Escuchar ${syllable.toLowerCase()}`);
    button.addEventListener("click", () => {
      button.animate([{ transform: "scale(1)" }, { transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 230 });
      say(syllable.toLowerCase());
    });
    syllableRow.append(button);
  });

  function setPrompt(index) {
    promptIndex = (index + syllables.length + words.length) % (syllables.length + words.length);
    const isWord = promptIndex >= syllables.length;
    const text = isWord ? words[promptIndex - syllables.length] : syllables[promptIndex];
    promptLabel.textContent = isWord ? "DI LA PALABRA" : "DI CON RORI";
    prompt.textContent = text;
    prompt.style.color = tones[promptIndex % tones.length];
  }

  function changePrompt(step = 1) {
    setPrompt(promptIndex + step);
    say(prompt.textContent, prompt.textContent.length > 2 ? 0.82 : 0.72);
    clearRecordedAudio();
    recordStatus.textContent = "Escucha y prueba a decirlo. ¡Sin prisa!";
    recordStatus.className = "record-status";
  }

  function clearRecordedAudio() {
    playbackButton.disabled = true;
    recording.pause();
    if (recording.src) URL.revokeObjectURL(recording.src);
    recording.removeAttribute("src");
    recording.load();
  }

  function showMode(mode) {
    const practice = mode === "practice";
    practiceTab.classList.toggle("active", practice);
    gameTab.classList.toggle("active", !practice);
    practicePanel.hidden = !practice;
    gamePanel.hidden = practice;
    if (!practice) newQuestion();
  }

  listenPrompt.addEventListener("click", () => say(prompt.textContent, prompt.textContent.length > 2 ? 0.82 : 0.72));
  nextPrompt.addEventListener("click", () => changePrompt());
  practiceTab.addEventListener("click", () => showMode("practice"));
  gameTab.addEventListener("click", () => showMode("game"));

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      recordStatus.textContent = "La grabación no funciona en este navegador. Puedes seguir escuchando y practicando.";
      recordStatus.className = "record-status error";
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedParts = [];
      recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) recordedParts.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!recordedParts.length) {
          recordStatus.textContent = "No se ha oído nada. ¿Probamos otra vez?";
          recordStatus.className = "record-status";
          return;
        }
        const blob = new Blob(recordedParts, { type: recorder.mimeType || "audio/webm" });
        recording.src = URL.createObjectURL(blob);
        playbackButton.disabled = false;
        recordButton.classList.remove("recording");
        recordButton.innerHTML = '<span class="mic" aria-hidden="true">●</span> Grabarme';
        recordStatus.textContent = "¡Qué bien! Ahora puedes escucharte.";
        recordStatus.className = "record-status success";
        say("¡Buen intento!", 0.9);
      }, { once: true });
      recorder.start();
      recordButton.classList.add("recording");
      recordButton.innerHTML = '<span class="mic" aria-hidden="true">●</span> Grabando…';
      recordStatus.textContent = "Di la sílaba o la palabra…";
      recordStatus.className = "record-status";
      recordingTimer = window.setTimeout(() => stopRecording(), 4000);
    } catch {
      recordStatus.textContent = "No pasa nada. Puedes jugar escuchando las sílabas.";
      recordStatus.className = "record-status error";
      recordButton.classList.remove("recording");
      recordButton.innerHTML = '<span class="mic" aria-hidden="true">●</span> Grabarme';
    }
  }

  function stopRecording() {
    clearTimeout(recordingTimer);
    if (recorder?.state === "recording") recorder.stop();
  }

  recordButton.addEventListener("click", () => {
    if (recorder?.state === "recording") stopRecording();
    else startRecording();
  });
  playbackButton.addEventListener("click", () => {
    if (!recording.src) return;
    recording.currentTime = 0;
    recording.play();
  });

  function newQuestion() {
    question = syllables[Math.floor(Math.random() * syllables.length)];
    gameFeedback.textContent = "¡A ver cuál es!";
    gameFeedback.className = "game-feedback";
    playQuestion.disabled = false;
    gameChoices.replaceChildren();
    syllables.forEach((syllable, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "game-choice";
      button.style.setProperty("--tone", tones[index]);
      button.textContent = syllable;
      button.addEventListener("click", () => answer(button, syllable));
      gameChoices.append(button);
    });
    playQuestion.onclick = () => say(question.toLowerCase());
    window.setTimeout(() => say(question.toLowerCase()), 350);
  }

  function answer(button, syllable) {
    if (playQuestion.disabled) return;
    if (syllable === question) {
      playQuestion.disabled = true;
      button.classList.add("good");
      earnedStars += 1;
      stars.textContent = `${"★ ".repeat(Math.min(earnedStars, 3))}${"☆ ".repeat(Math.max(0, 3 - earnedStars))}`.trim();
      gameFeedback.textContent = "¡Sí! ¡Muy bien!";
      gameFeedback.className = "game-feedback good";
      say("¡Sí! ¡Muy bien!", 0.9);
      window.setTimeout(newQuestion, 1400);
    } else {
      button.classList.add("try");
      button.disabled = true;
      gameFeedback.textContent = "Casi… escucha otra vez";
      say("Casi. Escucha otra vez", 0.9);
      window.setTimeout(() => {
        gameFeedback.textContent = "Toca el sonido que oíste";
        gameFeedback.className = "game-feedback";
      }, 850);
    }
  }

  setPrompt(0);
})();
