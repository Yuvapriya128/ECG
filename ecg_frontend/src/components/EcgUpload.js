import React, { useState, useRef } from 'react';
import './EcgUpload.css';

const ECGUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState('');
  const fileInputRef = useRef();
  const dropRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove('drag-over');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch('http://127.0.0.1:8000/api/predict/', {
            method: 'POST',
            body: formData,
          });

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        if (response.ok) {
          setPrediction(data.prediction);
        } else {
          alert(data.error || "Something went wrong.");
        }
      } catch (jsonError) {
        console.error("Non-JSON response from backend:", text);
        alert("Unexpected server error.");
      }

    } catch (error) {
      alert("Error uploading image");
      console.error("Fetch error:", error);
    }
  };

  return (
    <div className="upload-container">
      <h1>ECG Image Classifier</h1>

      <div
        className="drop-zone"
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p>Drag & drop ECG image here</p>
        <p>or</p>
        <button type="button" className="file-select-btn" onClick={handleClickUpload}>
          Choose ECG Image
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>

      {previewUrl && (
        <div className="preview">
          <img src={previewUrl} alt="Preview" className="image-preview" />
        </div>
      )}

      <button className="upload-button" onClick={handleUpload}>Predict</button>

      {prediction && (
        <div className="result">
          Prediction: <span>{prediction}</span>
        </div>
      )}
    </div>
  );
};

export default ECGUpload;
