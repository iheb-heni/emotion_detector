"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [status, setStatus] = useState("stopped");
  const [isLoading, setIsLoading] = useState(false);

  const BACKEND_URL = "http://127.0.0.1:5000/predict";

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
        setStatus("running");
        const id = setInterval(captureAndSendFrame, 800);
        setIntervalId(id);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Impossible d'accéder à la caméra : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setStreaming(false);
    setStatus("stopped");
    setEmotion(null);
    setConfidence(null);
  };

  const captureAndSendFrame = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const w = 480;
      const h = Math.round((video.videoHeight / video.videoWidth) * w) || 360;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmotion(data.emotion);
        setConfidence(data.confidence);
      } else {
        console.warn("Backend error:", data);
        if (data.error === "No face detected" || data.error === "Aucun visage détecté") {
          setEmotion(null);
          setConfidence(null);
        }
      }
    } catch (err) {
      console.error("Error sending frame:", err);
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      sad: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      angry: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      surprised: "linear-gradient(135deg, #a3bded 0%, #6991c7 100%)",
      neutral: "linear-gradient(135deg, #d3d3d3 0%, #a9a9a9 100%)",
      fear: "linear-gradient(135deg, #b8cbb8 0%, #b8cbb8 100%)",
      disgust: "linear-gradient(135deg, #c2e9c2 0%, #a8e6a8 100%)"
    };
    return colors[emotion?.toLowerCase()] || "linear-gradient(135deg, #d3d3d3 0%, #a9a9a9 100%)";
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      surprised: "😲",
      neutral: "😐",
      fear: "😨",
      disgust: "🤢"
    };
    return emojis[emotion?.toLowerCase()] || "❓";
  };

  return (
    <>
      <style jsx>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --glass-bg: rgba(255, 255, 255, 0.1);
          --glass-border: rgba(255, 255, 255, 0.2);
          --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: var(--primary-gradient);
          min-height: 100vh;
          color: white;
        }

        .container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .background-animation {
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0.3;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: float 6s ease-in-out infinite;
        }

        .circle-1 {
          width: 300px;
          height: 300px;
          background: #ff6b6b;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 400px;
          height: 400px;
          background: #4ecdc4;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .circle-3 {
          width: 350px;
          height: 350px;
          background: #45b7d1;
          bottom: 10%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        .content {
          position: relative;
          z-index: 10;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          background: linear-gradient(45deg, #9ecaffff, #0051ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .subtitle {
          font-size: 1.2rem;
          color: rgba(2, 2, 2, 0.8);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 2rem;
          padding: 2rem;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
        }

        .video-container {
          position: relative;
          aspect-ratio: 16/9;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 1.5rem;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.9rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid;
        }

        .status-running {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.3);
        }

        .status-stopped {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 1.5rem;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-start {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .btn-start:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .btn-stop {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .btn-stop:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }

        .emotion-display {
          text-align: center;
        }

        .emotion-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .emotion-emoji {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .emotion-emoji:hover {
          transform: scale(1.1);
        }

        .emotion-name {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-transform: capitalize;
        }

        .confidence-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          margin: 1.5rem 0;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1s ease-out;
        }

        .confidence-text {
          font-size: 1.3rem;
          font-weight: 600;
          color: #00bcd1ff;
        }

        .no-emotion {
          padding: 2rem 0;
        }

        .no-emotion-emoji {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 1rem;
          text-align: center;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #007e8cff;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .footer {
          text-align: center;
          margin-top: 3rem;
          color: rgba(5, 4, 4, 0.7);
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .floating-badge {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          background: rgba(6, 182, 212, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(6, 182, 212, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.9rem;
          color: #00acc0ff;
        }
      `}</style>

      <div className="container">
        {/* Background Animation */}
        <div className="background-animation">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>

        <div className="content">
          {/* Header */}
          <div className="header">
            <h1 className="title">Emotion AI</h1>
            <p className="subtitle">
              Découvrez la puissance de l&apos;IA pour analyser vos émotions en temps réel
            </p>
          </div>

          <div className="grid">
            {/* Video Section */}
            <div className="card">
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  className="video"
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                
                <div className={`status-indicator ${status === "running" ? "status-running" : "status-stopped"}`}>
                  ● {status === "running" ? "En direct" : "Arrêté"}
                </div>

                {isLoading && (
                  <div className="loading-overlay">
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <div className="spinner"></div>
                      <p style={{ marginTop: '1rem' }}>Initialisation de la caméra...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="controls">
                <button
                  onClick={startCamera}
                  disabled={streaming || isLoading}
                  className="btn btn-start"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <span>🎬</span>
                      Démarrer
                    </>
                  )}
                </button>
                
                <button
                  onClick={stopCamera}
                  disabled={!streaming}
                  className="btn btn-stop"
                >
                  <span>⏹️</span>
                  Arrêter
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Emotion Display */}
              <div className="card emotion-display">
                <h2 className="emotion-title">Analyse en Temps Réel</h2>
                
                {emotion ? (
                  <div>
                    <div 
                      className="emotion-emoji"
                      style={{ background: getEmotionColor(emotion) }}
                    >
                      {getEmotionEmoji(emotion)}
                    </div>
                    
                    <h3 className="emotion-name">
                      {emotion}
                    </h3>
                    
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${confidence}%`,
                          background: getEmotionColor(emotion)
                        }}
                      ></div>
                    </div>
                    
                    <p className="confidence-text">
                      Confiance : {confidence}%
                    </p>
                  </div>
                ) : (
                  <div className="no-emotion">
                    <div className="no-emotion-emoji">
                      🎭
                    </div>
                    <p style={{ color: 'rgba(18, 17, 17, 0.7)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      {streaming ? "Analyse en cours..." : "En attente de démarrage"}
                    </p>
                    <p style={{ color: 'rgba(3, 3, 3, 0.5)', fontSize: '0.9rem' }}>
                      Aucune émotion détectée pour le moment
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="card">
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' }}>Informations</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Fréquence</div>
                    <div className="stat-value">800ms</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Résolution</div>
                    <div className="stat-value">480p</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Statut</div>
                    <div className="stat-value" style={{ color: status === "running" ? '#4ade80' : '#f87171' }}>
                      {status === "running" ? "Actif" : "Inactif"}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Détection</div>
                    <div className="stat-value">{emotion ? "Active" : "En attente"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="footer">
            <p>
              L&apos;IA analyse les expressions faciales en temps réel avec une précision avancée. 
              Les données sont traitées localement et respectent votre vie privée.
            </p>
          </div>
        </div>

        {/* Floating Badge */}
        <div className="floating-badge">
          Powered by Iheb heni
        </div>
      </div>
    </>
  );
}