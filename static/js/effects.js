function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

// Button ripple effect
document.addEventListener("click", function(e){
    if(e.target.classList.contains("predict-btn")){
        e.target.classList.add("pulse");
        setTimeout(()=> {
            e.target.classList.remove("pulse");
        },300);
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

  if(slider){
    slider.oninput = function(){
      output.innerHTML = this.value;
    }
  }

});
