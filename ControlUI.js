class ControlUI {
  constructor() {
    this.createUI();
  }

  createUI() {
    // Control Display UI
    this.controlDisplay = document.createElement("div");
    this.controlDisplay.id = "controlDisplay";
    document.body.appendChild(this.controlDisplay);

    // Shuffle Message UI
    this.shuffleMessage = document.createElement("div");
    this.shuffleMessage.id = "shuffleMessage";
    this.shuffleMessage.innerText = "Controls Shuffled!";
    document.body.appendChild(this.shuffleMessage);
  }

  updateControlsDisplay(controlMap) {
    this.controlDisplay.innerHTML = `
      <strong>Current Controls:</strong><br>
      W → ${controlMap.KeyW}<br>
      A → ${controlMap.KeyA}<br>
      S → ${controlMap.KeyS}<br>
      D → ${controlMap.KeyD}
    `;
  }

  showShuffleMessage() {
    this.shuffleMessage.classList.add("visible");

    setTimeout(() => {
      this.shuffleMessage.classList.remove("visible");
    }, 2000);
  }

  playShuffleSound() {
    const shuffleSound = new Audio("/music/beep-sound-8333.mp3"); // Replace with actual sound file
    shuffleSound.play();
  }
}
