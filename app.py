from flask import Flask, request, jsonify, render_template, Response
import joblib
import numpy as np
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import csv
from io import StringIO

app = Flask(__name__)

# Configure SQLite Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///history.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Model
class PredictionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    inflation = db.Column(db.Float, nullable=False)
    population = db.Column(db.Float, nullable=False)
    exports = db.Column(db.Float, nullable=False)
    imports = db.Column(db.Float, nullable=False)
    fdi = db.Column(db.Float, nullable=False)
    savings = db.Column(db.Float, nullable=False)
    predicted_gdp = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Ensure database tables exist
with app.app_context():
    db.create_all()

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
    # Fetch descending by timestamp
    records = PredictionHistory.query.order_by(PredictionHistory.timestamp.desc()).all()
    return render_template("history.html", history=records)

@app.route("/settings")
def settings():
    return render_template("settings.html")

# ---------------- HEALTH CHECK ---------------- #
@app.route("/health")
def health():
    return jsonify({"status": "API is running successfully"})

# ---------------- HISTORY API ---------------- #
@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    try:
        db.session.query(PredictionHistory).delete()
        db.session.commit()
        return jsonify({"status": "History cleared successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/history/export")
def export_history():
    records = PredictionHistory.query.order_by(PredictionHistory.timestamp.desc()).all()
    
    def generate():
        data = StringIO()
        writer = csv.writer(data)
        
        # Write CSV Header
        writer.writerow(['ID', 'Inflation (%)', 'Population (B)', 'Exports', 'Imports', 'FDI', 'Savings (%)', 'Predicted GDP (T)', 'Timestamp (UTC)'])
        yield data.getvalue()
        data.seek(0)
        data.truncate(0)

        # Write Data
        for record in records:
            writer.writerow([
                record.id, record.inflation, record.population, record.exports, 
                record.imports, record.fdi, record.savings, record.predicted_gdp, 
                record.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            ])
            yield data.getvalue()
            data.seek(0)
            data.truncate(0)

    response = Response(generate(), mimetype='text/csv')
    response.headers.set("Content-Disposition", "attachment", filename="indigdp_history.csv")
    return response

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

        input_data = np.array([[inflation, population * 1000000000, exports, imports, fdi, savings]])
        input_scaled = scaler.transform(input_data)
        prediction = model.predict(input_scaled)
        
        predicted_gdp = round(float(prediction[0]), 2)
        
        # Save to DB
        new_record = PredictionHistory(
            inflation=inflation,
            population=population,
            exports=exports,
            imports=imports,
            fdi=fdi,
            savings=savings,
            predicted_gdp=predicted_gdp
        )
        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            "predicted_gdp": predicted_gdp,
            "unit": "Trillion USD"
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# ---------------- MAIN ---------------- #
if __name__ == "__main__":
    app.run(debug=True)
