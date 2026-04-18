import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import matplotlib.pyplot as plt

# Load dataset
data = pd.read_csv("data/india_gdp.csv")

# Features and Target
X = data.drop(["GDP", "Year"], axis=1)
y = data["GDP"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model
model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)

# Train model
model.fit(X_train_scaled, y_train)

# Predictions
y_pred = model.predict(X_test_scaled)

# Evaluation
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("RMSE:", rmse)
print("R2 Score:", r2)

# Save model and scaler
joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")
print("Model and scaler saved successfully")

# ---------------- VISUALIZATION ---------------- #
print("Generating performance plot...")
# Predict on full dataset for visualization
X_all_scaled = scaler.transform(X)
y_all_pred = model.predict(X_all_scaled)

plt.figure(figsize=(12, 6))
plt.plot(data["Year"], data["GDP"], label="Actual GDP", color="#007bff", linewidth=2, marker='o', markersize=4)
plt.plot(data["Year"], y_all_pred, label="Predicted GDP (AI)", color="#28a745", linestyle="--", linewidth=2)

plt.title("India GDP Prediction: Actual vs AI Model", fontsize=14, fontweight='bold')
plt.xlabel("Year", fontsize=12)
plt.ylabel("GDP (Trillion USD)", fontsize=12)
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

# Save plot
plot_path = "model_evaluation.png"
plt.savefig(plot_path)
print(f"Performance plot saved as: {plot_path}")
