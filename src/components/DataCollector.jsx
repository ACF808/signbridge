
import { useEffect, useRef, useState } from "react";

const LETTERS = ["A", "B", "L"];
const SAMPLES_PER_LETTER = 100;

function normaliseLandmarks(landmarks) {
  const wrist = landmarks[0];

  // Centre all coordinates around the wrist.
  const centred = landmarks.map((point) => ({
    x: point.x - wrist.x,
    y: point.y - wrist.y,
    z: point.z - wrist.z,
  }));

  // Scale by the maximum distance from the wrist.
  const scale = Math.max(
    ...centred.map((point) =>
      Math.hypot(point.x, point.y, point.z)
    ),
    0.00001
  );

  return centred.flatMap((point) => [
    point.x / scale,
    point.y / scale,
    point.z / scale,
  ]);
}

export default function DataCollector({ landmarksRef }) {
  const [letter, setLetter] = useState("A");
  const [counts, setCounts] = useState({});
  const [recording, setRecording] = useState(false);
  const samplesRef = useRef([]);
  const lastSampleRef = useRef(0);

  useEffect(() => {
    if (!recording) return;

    const interval = setInterval(() => {
      const landmarks = landmarksRef.current;

      if (!landmarks || landmarks.length !== 21) return;

      const now = performance.now();

      if (now - lastSampleRef.current < 100) return;

      const count = samplesRef.current.filter(
        (sample) => sample.label === letter
      ).length;

      if (count >= SAMPLES_PER_LETTER) {
        setRecording(false);
        return;
      }

      samplesRef.current.push({
        label: letter,
        features: normaliseLandmarks(landmarks),
      });

      lastSampleRef.current = now;

      setCounts((prev) => ({
        ...prev,
        [letter]: count + 1,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [recording, letter, landmarksRef]);

  function downloadCSV() {
    if (samplesRef.current.length === 0) return;

    const headers = [
      "label",
      ...Array.from({ length: 63 }, (_, i) => `feature_${i}`),
    ];

    const rows = samplesRef.current.map((sample) =>
      [sample.label, ...sample.features].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "signbridge_training_data.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="data-collector">
      <h3>collect training data</h3>
      <p>
        Choose a letter, hold up its handshape, and record samples.
      </p>

      <div className="collector-letters">
        {LETTERS.map((item) => (
          <button
            key={item}
            className={letter === item ? "active" : ""}
            onClick={() => {
              setRecording(false);
              setLetter(item);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <p>
        Samples for {letter}: {counts[letter] || 0} / {SAMPLES_PER_LETTER}
      </p>

      <button
        onClick={() => setRecording((prev) => !prev)}
        disabled={(counts[letter] || 0) >= SAMPLES_PER_LETTER}
      >
        {recording ? "stop recording" : "record samples"}
      </button>

      <button onClick={downloadCSV}>
        download CSV
      </button>
    </div>
  );
}
