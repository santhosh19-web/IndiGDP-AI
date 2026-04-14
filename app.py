from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np

app = Flask(__name__)

# Load model and scaler
model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

# ---------------- HOME PAGE ---------------- #

@app.route("/")
def home():
    return render_template("index.html")

# ---------------- DASHBOARD PAGE ---------------- #

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/history")
def history():
    return render_template("history.html")


@app.route("/settings")
def settings():
    return render_template("settings.html")


# ---------------- HEALTH CHECK ---------------- #

@app.route("/health")
def health():
    return jsonify({"status": "API is running successfully"})


# ---------------- PREDICTION API ---------------- #

@app.route("/api/predict", methods=["POST"])
def predict():

    try:
        data = request.get_json()

        inflation = float(data["inflation"])
        population = float(data["population"])
        exports = float(data["exports"])
        imports = float(data["imports"])
        fdi = float(data["fdi"])
        savings = float(data["savings"])

        input_data = np.array([[inflation, population, exports, imports, fdi, savings]])

        input_scaled = scaler.transform(input_data)

        prediction = model.predict(input_scaled)

        return jsonify({
            "predicted_gdp": round(float(prediction[0]), 2),
            "unit": "Trillion USD"
        })

    except Exception as e:
        return jsonify({"error": str(e)})


# ---------------- MAIN ---------------- #

if __name__ == "__main__":
    app.run(debug=True)
