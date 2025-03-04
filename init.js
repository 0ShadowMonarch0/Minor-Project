(function () {
  const overworld = new Overworld({
    element: document.querySelector(".game-container"),
  });
  const startButton = document.getElementById("start-button");
  const startScreen = document.querySelector(".start-screen");

  startButton.addEventListener("click", () => {
    startScreen.classList.remove("active");
    overworld.init();
  });
})();
