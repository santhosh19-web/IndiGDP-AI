// Theme Persistence Logic
function loadTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
}

// Call immediately to prevent flash if imported high up
loadTheme();

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Button haptic effect (Spring simulation)
document.addEventListener("click", function(e){
    if(e.target.classList.contains("predict-btn") || e.target.classList.contains("btn-haptic")){
        e.target.style.transform = "scale(0.95)";
        setTimeout(()=> {
            e.target.style.transform = "";
        }, 150);
    }
});

// Slider Live Update
const sliders = [
  ["inflation","inflationValue"],
  ["population","populationValue"],
  ["exports","exportsValue"],
  ["imports","importsValue"],
  ["fdi","fdiValue"],
  ["savings","savingsValue"]
];

sliders.forEach(pair => {
  const slider = document.getElementById(pair[0]);
  const output = document.getElementById(pair[1]);

  if(slider && output){
    slider.oninput = function(){
      output.innerHTML = this.value;
    }
  }
});
