import React, { useState } from 'react';
import { ragAPI } from '../services/api';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');

    try {
      await ragAPI.uploadDocument(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Educational Document</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="success-state">
              <CheckCircle size={48} color="#10b981" />
              <p>Document uploaded successfully!</p>
              <p className="success-subtitle">
                The content has been added to the knowledge base
              </p>
            </div>
          ) : (
            <>
              <div className="upload-area">
                <Upload size={48} />
                <p>Upload a document to enhance the chatbot's knowledge</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.pdf,.doc,.docx"
                  id="file-input"
                />
                <label htmlFor="file-input" className="btn-select-file">
                  Select File
                </label>
                {file && (
                  <div className="file-info">
                    <p>Selected: {file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                className="btn-upload-submit"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>

              <p className="upload-note">
                Supported formats: .txt, .pdf, .doc, .docx (Max 5MB)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;