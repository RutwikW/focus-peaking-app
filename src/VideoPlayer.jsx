import React, { useRef, useEffect, useState } from "react";
import cv from "@techstark/opencv-js";

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [focusPeaking, setFocusPeaking] = useState(false);

  useEffect(() => {
    if (!focusPeaking) return;

    let animationId;

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Match canvas size to the actual video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to an offscreen canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = video.videoWidth;
      offscreen.height = video.videoHeight;
      const offCtx = offscreen.getContext("2d");
      offCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // Convert that offscreen canvas to an OpenCV Mat
      let frame = cv.imread(offscreen);
      let gray = new cv.Mat();
      let edges = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY, 0);

      // Run Canny edge detection
      cv.Canny(gray, edges, 100, 200);

      // Color the edges red in the original frame
      for (let y = 0; y < edges.rows; y++) {
        for (let x = 0; x < edges.cols; x++) {
          let edgeVal = edges.ucharPtr(y, x)[0];
          if (edgeVal > 0) {
            // This pixel is an edge → paint it red
            let pixel = frame.ucharPtr(y, x);
            pixel[0] = 255; // R
            pixel[1] = 0;   // G
            pixel[2] = 0;   // B
            pixel[3] = 255; // A
          }
        }
      }

      // Show the resulting frame (with red edges) in the canvas
      cv.imshow(canvas, frame);

      // Cleanup
      frame.delete();
      gray.delete();
      edges.delete();

      // Schedule the next frame
      animationId = requestAnimationFrame(processFrame);
    };

    // Start processing frames
    animationId = requestAnimationFrame(processFrame);

    // Cleanup on unmount or toggle off
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [focusPeaking]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Focus Peaking Video Player</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        {/* Left: Original video with controls */}
        <video
          ref={videoRef}
          src="/video/exploreHD-Focus.mp4"
          controls
          style={{ width: "480px", height: "auto" }}
        />

        {/* Right: Canvas for focus-peaking preview */}
        {focusPeaking && (
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid #ccc",
              width: "480px",
              height: "auto",
            }}
          />
        )}
      </div>

      {/* Toggle Button */}
      <button onClick={() => setFocusPeaking(!focusPeaking)} style={{ marginTop: "20px" }}>
        {focusPeaking ? "Hide Focus Peaking" : "Show Focus Peaking"}
      </button>
    </div>
  );
};

export default VideoPlayer;