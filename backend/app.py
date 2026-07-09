import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)

# Load trained model
model = joblib.load("../model/disease_model.pkl")

# Load symptom encoder
mlb = joblib.load("../model/symptom_encoder.pkl")

# Load datasets
description_df = pd.read_csv("../dataset/symptom_Description.csv")
precaution_df = pd.read_csv("../dataset/symptom_precaution.csv")

# Clean disease names
description_df["Disease"] = (
    description_df["Disease"].astype(str).str.strip().str.lower()
)

precaution_df["Disease"] = (
    precaution_df["Disease"].astype(str).str.strip().str.lower()
)


@app.route("/")
def home():
    return jsonify({
        "message": "AI Medical Diagnosis Assistant Backend is Working!"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get symptoms from frontend
        data = request.get_json()
        symptoms = data.get("symptoms", [])

        # ---------------- EMPTY INPUT VALIDATION ----------------
        if not symptoms:
            return jsonify({
                "error": "Please enter at least one symptom."
            }), 400

        # ---------------- INVALID SYMPTOM VALIDATION ----------------
        valid_symptoms = set(mlb.classes_)

        invalid_symptoms = [
            symptom.strip()
            for symptom in symptoms
            if symptom.strip() not in valid_symptoms
        ]

        if len(invalid_symptoms) == len(symptoms):
            return jsonify({
                "error": "No valid symptoms entered. Please enter valid medical symptoms."
            }), 400

        # Convert symptoms to model input
        X = mlb.transform([symptoms])

        # Predict disease
        prediction = model.predict(X)[0]

        # Predict probabilities
        probabilities = model.predict_proba(X)[0]

        confidence = max(probabilities) * 100

        disease = prediction
        disease_key = disease.strip().lower()

        # ---------------- TOP 3 PREDICTIONS ----------------

        diseases = model.classes_

        top_predictions = sorted(
            zip(diseases, probabilities),
            key=lambda x: x[1],
            reverse=True
        )[:3]

        top_predictions = [
            {
                "disease": disease_name,
                "confidence": round(prob * 100, 2)
            }
            for disease_name, prob in top_predictions
        ]

        # ---------------- DESCRIPTION ----------------

        desc = description_df[
            description_df["Disease"] == disease_key
        ]

        if not desc.empty:
            description = desc.iloc[0]["Description"]
        else:
            description = "No description available."

        # ---------------- PRECAUTIONS ----------------

        pre = precaution_df[
            precaution_df["Disease"] == disease_key
        ]

        if not pre.empty:
            precautions = pre.iloc[0, 1:].fillna("").tolist()

            precautions = [
                str(item).strip()
                for item in precautions
                if str(item).strip() != ""
            ]

            precautions = list(dict.fromkeys(precautions))
        else:
            precautions = []

        # ---------------- RESPONSE ----------------

        return jsonify({
            "predicted_disease": disease,
            "confidence": round(confidence, 2),
            "description": description,
            "precautions": precautions,
            "top_predictions": top_predictions
        })

    except Exception as e:
        print(e)

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)