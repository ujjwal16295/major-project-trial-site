'use client';

import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let scanInterval = useRef(null);

  useEffect(() => {
    startCamera();
    scanInterval.current = setInterval(scanQRCode, 1000); // Auto-detect QR every second
    return () => clearInterval(scanInterval.current);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Error accessing camera.');
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      setUrl(code.data);
      clearInterval(scanInterval.current); // Stop scanning once QR is found
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result;
      await img.decode();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, img.width, img.height);
      if (code) {
        setUrl(code.data);
      } else {
        setError('No QR code found in image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!url) {
      setError('No URL extracted from QR code.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', {
        email: 'newujjwalpatel@gmail.com', // Replace with actual email
        api_key: 'd4a6251e4c9c435152b105a611b4751a32f078e3df1695b74630f6df438ab69e',   // Replace with actual API key
        url,
      });
      setClassification(response.data.classification);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing request.');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center text-center">
      <h1 className="text-xl font-bold mb-4">QR Code Scanner</h1>
      <video ref={videoRef} className="w-full max-w-md" autoPlay playsInline></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <input type="file" accept="image/*" onChange={handleFileUpload} className="mt-2" />
      {url && <p className="text-blue-500 break-words max-w-full">Extracted URL: {url}</p>}
      <button 
        onClick={handleSubmit} 
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded w-full max-w-xs"
        disabled={!url}
      >
        Scan & Classify
      </button>
      {classification && <p className="mt-4 text-green-500">Classification: {classification}</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
    </div>
  );
}
