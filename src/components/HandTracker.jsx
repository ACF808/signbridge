
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  const [status, setStatus] = useState("Camera is off");
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clean up when leaving the practice screen.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  async function startCamera() {
    if (loading || isRunning) return;

    setLoading(true);
    setStatus("Loading hand tracking...");

    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      const landmarker = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        }
      );

      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;

      await video.play();

      setIsRunning(true);
      setStatus("Looking for your hand...");

      detectHands();
    } catch (error) {
      console.error("Camera setup failed:", error);
      setStatus("Couldn't start camera. Check permissions.");
      stopCamera();
    } finally {
      setLoading(false);
    }
  }

  function detectHands() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const results = landmarker.detectForVideo(
        video,
        performance.now()
      );

      if (results.landmarks.length > 0) {
        setStatus("Hand detected!");

        for (const landmarks of results.landmarks) {
          // Draw connections between landmarks.
          for (const connection of CONNECTIONS) {
            const start = landmarks[connection.start];
            const end = landmarks[connection.end];

            ctx.beginPath();
            ctx.moveTo(
              start.x * canvas.width,
              start.y * canvas.height
            );
            ctx.lineTo(
              end.x * canvas.width,
              end.y * canvas.height
            );
            ctx.strokeStyle = "#8b75ce";
            ctx.lineWidth = 4;
            ctx.stroke();
          }

          // Draw all 21 landmarks.
          for (const point of landmarks) {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              5,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = "#f7a8c4";
            ctx.fill();
          }
        }
      } else {
        setStatus("Looking for your hand...");
      }
    }

    frameRef.current = requestAnimationFrame(detectHands);
  }

  function stopCamera() {
    cancelAnimationFrame(frameRef.current);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(
        0, 0, canvas.width, canvas.height
      );
    }

    setIsRunning(false);
    setStatus("Camera is off");
  }

  return (
    <div className="hand-tracker">
      <div className="camera-view">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />

        <canvas ref={canvasRef} />

        {!isRunning && (
          <div className="camera-overlay">
            <span className="camera-emoji">📷</span>
            <h3>ready when you are!</h3>
            <p>Turn on your camera to start practising.</p>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <span className="camera-status">{status}</span>

        {isRunning ? (
          <button
            className="camera-button"
            onClick={stopCamera}
          >
            turn off camera
          </button>
        ) : (
          <button
            className="camera-button"
            onClick={startCamera}
            disabled={loading}
          >
            {loading ? "loading..." : "turn on camera"}
          </button>
        )}
      </div>
    </div>
  );
}