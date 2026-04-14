async function predictGDP() {

const loader = document.getElementById("loader");
const resultBox = document.getElementById("resultBox");

const data = {
 inflation: inflation.value,
 population: population.value,
 exports: exports.value,
 imports: imports.value,
 fdi: fdi.value,
 savings: savings.value
};

if(!validateInputs(data)){
 resultBox.innerHTML="⚠ Invalid Inputs";
 return;
}

loader.style.display="block";
resultBox.innerHTML="";

const response = await fetch("/api/predict",{
 method:"POST",
 headers:{"Content-Type":"application/json"},
 body:JSON.stringify(data)
});

const res = await response.json();

loader.style.display="none";

localStorage.setItem("gdp",res.predicted_gdp);

resultBox.innerHTML = `🇮🇳 Predicted GDP: ${res.predicted_gdp} Trillion USD ✅`;

document.getElementById("status").innerHTML = "Prediction Done";


drawChart(res.predicted_gdp);
}
