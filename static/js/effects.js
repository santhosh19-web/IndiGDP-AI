// Preference Persistence Logic
function loadPreferences() {
    // 1. Load Dark Mode
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    // 2. Load Theme Color
    const color = localStorage.getItem("theme_color");
    if (color && color !== "default") {
        document.body.classList.add(`theme-${color}`);
    }

    // 3. Load Font Size
    const font = localStorage.getItem("font_size");
    if (font && font !== "medium") {
        document.body.classList.add(`font-${font}`);
    }

    // 4. Load Profile
    const profileName = localStorage.getItem("profile_name");
    if (profileName) {
        const sidebarName = document.getElementById("sidebarName");
        if (sidebarName) sidebarName.textContent = profileName + "'s Dashboard";
    }
}

// Call immediately to prevent flash if imported high up
loadPreferences();

function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function changeThemeColor(color) {
    document.body.classList.remove("theme-blue", "theme-green", "theme-purple");
    if (color !== "default") {
        document.body.classList.add(`theme-${color}`);
    }
    localStorage.setItem("theme_color", color);
}

function changeFontSize(size) {
    document.body.classList.remove("font-small", "font-large");
    if (size !== "medium") {
        document.body.classList.add(`font-${size}`);
    }
    localStorage.setItem("font_size", size);
}

function initSettings() {
    // Pre-fill Dark Mode toggle
    if (localStorage.getItem("theme") === "dark") {
        const tToggle = document.getElementById('themeToggle');
        if (tToggle) tToggle.checked = true;
    }

    // Pre-fill Theme Color
    const color = localStorage.getItem("theme_color");
    if (color) {
        const colorSelect = document.getElementById('colorSelect');
        if(colorSelect) colorSelect.value = color;
    }

    // Pre-fill Font Size
    const font = localStorage.getItem("font_size");
    if (font) {
        const fontSelect = document.getElementById('fontSelect');
        if(fontSelect) fontSelect.value = font;
    }

    // Pre-fill Profile
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const avatarPreview = document.getElementById("avatarPreview");
    
    if (nameInput) nameInput.value = localStorage.getItem("profile_name") || "";
    if (emailInput) emailInput.value = localStorage.getItem("profile_email") || "";
    
    const savedAvatar = localStorage.getItem("profile_avatar");
    if (savedAvatar && avatarPreview) {
        avatarPreview.src = savedAvatar;
        avatarPreview.style.display = "block";
    }

    // Handle avatar upload preview
    const avatarInput = document.getElementById("avatarInput");
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function saveProfile() {
    const nameInput = document.getElementById("profileName").value;
    const emailInput = document.getElementById("profileEmail").value;
    const avatarPreview = document.getElementById("avatarPreview").src;
    
    localStorage.setItem("profile_name", nameInput);
    localStorage.setItem("profile_email", emailInput);
    
    if (avatarPreview && avatarPreview !== window.location.href && avatarPreview.startsWith("data:image")) {
        localStorage.setItem("profile_avatar", avatarPreview);
    }

    // Update sidebar dynamically if on settings page
    const sidebarName = document.getElementById("sidebarName");
    if (sidebarName && nameInput) sidebarName.textContent = nameInput + "'s Dashboard";

    // Show success message
    const status = document.getElementById("profileStatus");
    if (status) {
        status.style.display = "block";
        setTimeout(() => status.style.display = "none", 3000);
    }
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
      output.innerHTML = parseFloat(this.value).toFixed(2);
    }
  }
});
