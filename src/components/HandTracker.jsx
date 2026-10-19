
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import DataCollector from "./DataCollector";

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

  // Stores the latest hand landmarks for DataCollector.
  const landmarksRef = useRef(null);

  // Helps prevent overlapping camera operations.
  const runningRef = useRef(false);
  const sessionRef = useRef(0);

  const [status, setStatus] = useState("Camera is off");
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clean up resources when leaving the practice page.
  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      runningRef.current = false;

      cancelAnimationFrame(frameRef.current);

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
      landmarksRef.current = null;

      landmarkerRef.current?.close();
      landmarkerRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  async function startCamera() {
    if (loading || runningRef.current) return;

    const session = ++sessionRef.current;

    setLoading(true);
    setStatus("Loading hand tracking...");

    let landmarker = null;
    let stream = null;

    try {
      // Load MediaPipe's WebAssembly runtime.
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      if (session !== sessionRef.current) return;

      // Create the hand tracking model.
      try {
        landmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
          }
        );
      } catch (gpuError) {
        console.warn(
          "GPU unavailable, falling back to CPU:",
          gpuError
        );

        landmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
          }
        );
      }

      if (session !== sessionRef.current) return;

      landmarkerRef.current = landmarker;

      // Request webcam access.
      setStatus("Starting camera...");

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      if (session !== sessionRef.current) return;

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) return;

      video.srcObject = stream;

      await video.play();

      if (session !== sessionRef.current) return;

      runningRef.current = true;
      setIsRunning(true);
      setStatus("Looking for your hand...");

      detectHands();
    } catch (error) {
      console.error("Camera setup failed:", error);

      if (session === sessionRef.current) {
        stopCamera();
        setStatus(
          error.name === "NotAllowedError"
            ? "Camera permission denied."
            : "Couldn't start camera. Check the console."
        );
      }
    } finally {
      // Release resources if the session was cancelled.
      if (session !== sessionRef.current) {
        stream?.getTracks().forEach((track) => track.stop());
        landmarker?.close();
      } else {
        setLoading(false);
      }
    }
  }

  function detectHands() {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    if (video.readyState >= 2) {
      // Match the canvas resolution to the webcam.
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const results = landmarker.detectForVideo(
          video,
          performance.now()
        );

        // Share the most recent landmarks with DataCollector.
        landmarksRef.current = results.landmarks[0] ?? null;

        if (results.landmarks.length > 0) {
          setStatus((prev) =>
            prev === "Hand detected!"
              ? prev
              : "Hand detected!"
          );

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

            // Draw the 21 landmark points.
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
          setStatus((prev) =>
            prev === "Looking for your hand..."
              ? prev
              : "Looking for your hand..."
          );
        }
      } catch (error) {
        console.error("Hand tracking failed:", error);
        stopCamera();
        setStatus("Hand tracking stopped unexpectedly.");
        return;
      }
    }

    frameRef.current = requestAnimationFrame(detectHands);
  }

  function stopCamera() {
    // Invalidate any pending startup.
    sessionRef.current += 1;
    runningRef.current = false;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;

    landmarksRef.current = null;

    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;

    if (canvas) {
      canvas
        .getContext("2d")
        ?.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsRunning(false);
    setLoading(false);
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
            <p>
              Turn on your camera to start practising.
            </p>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <span className="camera-status">
          {status}
        </span>

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
            {loading
              ? "loading..."
              : "turn on camera"}
          </button>
        )}
      </div>

      {/* Training data collection */}
      <DataCollector landmarksRef={landmarksRef} />
    </div>
  );
}
