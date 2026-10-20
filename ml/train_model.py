
import json
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "training_data.csv"
MODEL_PATH = BASE_DIR / "asl_model.pkl"
EXPORT_PATH = BASE_DIR.parent / "public" / "asl_model.json"

# Load dataset
df = pd.read_csv(DATA_PATH)

feature_columns = [f"feature_{i}" for i in range(63)]

required_columns = ["label"] + feature_columns
missing = [col for col in required_columns if col not in df.columns]

if missing:
    raise ValueError(f"Missing CSV columns: {missing}")

df = df.dropna(subset=required_columns)

X = df[feature_columns]
y = df["label"].astype(str).str.upper().str.strip()

print("\nSIGNBRIDGE MODEL TRAINING")
print("=" * 35)

print(f"Total samples: {len(df)}")
print("\nSamples per letter:")
print(y.value_counts().sort_index())

if y.nunique() < 2:
    raise ValueError("Collect at least two different letters first.")

if y.value_counts().min() < 2:
    raise ValueError("Each letter needs at least two samples.")

# Split data for initial testing.
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

# Train classifier
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    random_state=42,
    n_jobs=-1,
)

print("\nTraining model...")
model.fit(X_train, y_train)

# Evaluate
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print(f"\nTest accuracy: {accuracy * 100:.2f}%")

print("\nClassification report:")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0,
    )
)

labels = sorted(y.unique())

print("Confusion matrix:")
print(
    pd.DataFrame(
        confusion_matrix(y_test, predictions, labels=labels),
        index=[f"Actual {label}" for label in labels],
        columns=[f"Predicted {label}" for label in labels],
    )
)

# Save Python model
joblib.dump(model, MODEL_PATH)
print(f"\nSaved Python model: {MODEL_PATH}")

# Export the forest to JSON for browser inference.
# Each tree contains the feature and threshold for
# each decision node, plus the class probabilities
# stored at each leaf.
trees = []

for estimator in model.estimators_:
    tree = estimator.tree_

    trees.append({
        "children_left": tree.children_left.tolist(),
        "children_right": tree.children_right.tolist(),
        "feature": tree.feature.tolist(),
        "threshold": tree.threshold.tolist(),
        "value": tree.value[:, 0, :].tolist(),
    })

export = {
    "model_type": "random_forest",
    "classes": model.classes_.tolist(),
    "feature_count": len(feature_columns),
    "trees": trees,
}

EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

with open(EXPORT_PATH, "w", encoding="utf-8") as f:
    json.dump(export, f)

print(f"Saved browser model: {EXPORT_PATH}")
print("\n Done!")
