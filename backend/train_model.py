import pandas as pd
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Load dataset
df = pd.read_csv("../dataset/dataset.csv")

# Replace missing values with empty strings
df.fillna("", inplace=True)

# Get all symptom columns
symptom_columns = df.columns[1:]

# Create list of symptoms for each disease
symptom_lists = []

for _, row in df.iterrows():
    symptoms = []

    for col in symptom_columns:
        symptom = str(row[col]).strip()

        if symptom != "":
            symptoms.append(symptom)

    symptom_lists.append(symptoms)

# Convert symptoms into binary vectors
mlb = MultiLabelBinarizer()

X = mlb.fit_transform(symptom_lists)

# Labels
y = df["Disease"]

# Train model
model = RandomForestClassifier(
    n_estimators=300,
    random_state=42
)

model.fit(X, y)

# Create model folder
os.makedirs("../model", exist_ok=True)

# Save files
joblib.dump(model, "../model/disease_model.pkl")
joblib.dump(mlb, "../model/symptom_encoder.pkl")

print("✅ Model trained successfully!")
print("Diseases:", len(model.classes_))
print("Symptoms:", len(mlb.classes_))