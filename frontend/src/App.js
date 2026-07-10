import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./App.css";

function App() {
  const [symptoms, setSymptoms] = useState("");
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState("");
  const [description, setDescription] = useState("");
  const [precautions, setPrecautions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const [history, setHistory] = useState([]);
  const [severity, setSeverity] = useState("");
  const [topPredictions, setTopPredictions] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const predictDisease = async () => {
    setLoading(true);

    try {
      const symptomList = symptoms
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

        if (symptomList.length === 0) {
          alert("Please enter at least one symptom before predicting.");
          setLoading(false);
          return;
}

      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        {
          symptoms: symptomList,
        }
      );

      setPrediction(response.data.predicted_disease);
      setConfidence(response.data.confidence);
      setDescription(response.data.description);
      setPrecautions(response.data.precautions);
      setTopPredictions(response.data.top_predictions || []);
      setTime(new Date().toLocaleString());

      const high = [
        "Heart attack",
        "Pneumonia",
        "Paralysis (brain hemorrhage)",
      ];

      const medium = [
        "Malaria",
        "Dengue",
        "Typhoid",
        "Jaundice",
      ];

      if (high.includes(response.data.predicted_disease)) {
        setSeverity("🔴 High");
      } else if (medium.includes(response.data.predicted_disease)) {
        setSeverity("🟠 Medium");
      } else {
        setSeverity("🟢 Low");
      }

      setHistory((prev) => [
        {
          disease: response.data.predicted_disease,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    } catch (error) {
  console.log(error);

  if (error.response && error.response.data.error) {
    alert(error.response.data.error);
  } else {
    alert("Prediction Failed");
  }
} finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
  setSymptoms("");
  setPrediction("");
  setConfidence("");
  setDescription("");
  setPrecautions([]);
  setSeverity("");
  setTopPredictions([]);
  setTime("");
  setHistory([]);
};

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("AI Medical Diagnosis Report", 20, 20);

    doc.setFontSize(12);

    doc.text("Symptoms:", 20, 40);
    doc.text(symptoms, 20, 48);

    doc.text("Predicted Disease:", 20, 65);
    doc.text(prediction, 20, 73);

    doc.text("Severity:", 20, 90);
    doc.text(severity, 20, 98);

    doc.text("Confidence:", 20, 115);
    doc.text(confidence + "%", 20, 123);

    doc.text("Description:", 20, 140);

    const lines = doc.splitTextToSize(description, 170);
    doc.text(lines, 20, 148);

    let y = 148 + lines.length * 7 + 10;

    doc.text("Precautions:", 20, y);

    precautions.forEach((item) => {
      y += 8;
      doc.text("- " + item, 25, y);
    });

    y += 15;

    doc.text("Prediction Time:", 20, y);
    doc.text(time, 20, y + 8);

    doc.save("Medical_Diagnosis_Report.pdf");
  };


  const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    setSymptoms((prev) =>
      prev ? prev + ", " + transcript : transcript
    );
  };

  recognition.onerror = (event) => {
    alert("Speech Error: " + event.error);
  };

  recognition.onend = () => {
    console.log("Speech recognition ended.");
  };

  recognition.start();
};

  return (
    <div className={darkMode ? "container dark" : "container"}>
      <h1>🩺 AI Medical Diagnosis Assistant</h1>

      <button
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? "Light Mode" : "Dark Mode"}
</button>

<br /><br />

      <p>Enter your symptoms below</p>

      <textarea
        rows="6"
        placeholder="Example: fever, cough, headache"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />

      <br />
      <br />

      <button onClick={predictDisease} disabled={loading}>
        {loading ? "Predicting..." : "Predict Disease"}
      </button>

      &nbsp;&nbsp;


      <button onClick={clearAll} disabled={loading}>
  Clear
</button>

&nbsp;&nbsp;

<button onClick={startListening} disabled={loading}>
  🎤 Voice
</button>

      <br />
      <br />

      {prediction && (
        <>
          <div className="result">

            <h2>🩺 Predicted Disease</h2>

            <p><strong>{prediction}</strong></p>

            <h3>⚠️ Severity</h3>

            <p><strong>{severity}</strong></p>

            <h3>📊 Confidence</h3>

            <p><strong>{confidence}%</strong></p>

            <h3>🏆 Top 3 Predictions</h3>

            <ul>
              {topPredictions.map((item, index) => (
                <li key={index}>
                  {index + 1}. {item.disease} ({item.confidence}%)
                </li>
              ))}
            </ul>

            <h3>📖 Description</h3>

            <p>{description}</p>

            <h3>💊 Precautions</h3>

            <ul>
              {precautions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <p>
              <strong>🕒 Prediction Time:</strong> {time}
            </p>

            <br />

            <button onClick={downloadPDF}>
              📄 Download Report
            </button>

            &nbsp;&nbsp;

<button
  onClick={() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      window.open(
        `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},15z`,
        "_blank"
      );
    });
  }}
>
  🏥 Nearby Hospitals
</button>

            <p className="warning">
              ⚠️ This prediction is generated by an AI model and is not a substitute
              for professional medical advice.
            </p>

          </div>

          <div className="result">

            <h2>📜 Search History</h2>

            <ul>
              {history.map((item, index) => (
                <li key={index}>
                  <strong>{item.disease}</strong> - {item.time}
                </li>
              ))}
            </ul>

          </div>
        </>
      )}

      <footer>
        Made by <strong>C S Ganavi Prasad</strong>
      </footer>
    </div>
  );
}

export default App;