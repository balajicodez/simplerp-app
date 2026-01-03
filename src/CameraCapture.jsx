import React, { useRef, useState } from "react";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [stream, setStream] = useState(null);

  // Start Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera for mobile
        audio: false
      });

      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      alert("Camera access denied or not available");
    }
  };

  // Capture Image
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");
    setImage(imageData);
  };

  // Stop Camera
  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
  };

  return (
    <div>
      <button onClick={startCamera}>Open Camera</button>
      <button onClick={captureImage}>Capture</button>
      <button onClick={stopCamera}>Stop</button>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "300px", marginTop: "10px" }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {image && (
        <div>
          <h4>Captured Image</h4>
          <img src={image} alt="captured" width="300" />
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
