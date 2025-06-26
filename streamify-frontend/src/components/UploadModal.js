import React, { useState, useRef } from 'react';
import { 
  MAX_FILE_SIZE, 
  MAX_FILE_SIZE_TEXT, 
  SUPPORTED_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_IMAGE_FORMATS,
  isValidFileType,
  isValidFileSize,
  getFileTypeIcon,
  getFileTypeDescription,
  getSupportedFormatsText,
  formatFileSize
} from '../utils/helpers';
import './UploadModal.css';

const UploadModal = ({ isOpen, onClose, onUpload, serverUrl }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 파일 형식 검증
      if (!isValidFileType(selectedFile)) {
        setError('지원하지 않는 파일 형식입니다. 비디오 또는 이미지 파일을 선택해주세요.');
        return;
      }
      
      // 파일 크기 제한
      if (!isValidFileSize(selectedFile)) {
        setError(`파일 크기는 ${MAX_FILE_SIZE_TEXT} 이하여야 합니다.`);
        return;
      }
      
      setFile(selectedFile);
      setError('');
      
      // 파일명을 제목으로 자동 설정 (제목이 비어있는 경우)
      if (!title.trim()) {
        const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(fileNameWithoutExt);
      }
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!isValidFileType(droppedFile)) {
        setError('지원하지 않는 파일 형식입니다. 비디오 또는 이미지 파일을 선택해주세요.');
        return;
      }
      
      if (!isValidFileSize(droppedFile)) {
        setError(`파일 크기는 ${MAX_FILE_SIZE_TEXT} 이하여야 합니다.`);
        return;
      }
      
      setFile(droppedFile);
      setError('');
      
      // 파일명을 제목으로 자동 설정 (제목이 비어있는 경우)
      if (!title.trim()) {
        const fileNameWithoutExt = droppedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(fileNameWithoutExt);
      }
    }
  };

  // 업로드 처리
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('hashtags', hashtags.trim());
      formData.append('isPrivate', isPrivate);

      const token = localStorage.getItem('token');
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUpload(response);
          resetForm();
          onClose();
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          setError(errorResponse.error || '업로드에 실패했습니다.');
        }
        setUploading(false);
        setProgress(0);
      });

      xhr.addEventListener('error', () => {
        setError('네트워크 오류가 발생했습니다.');
        setUploading(false);
        setProgress(0);
      });

      xhr.open('POST', `${serverUrl}/api/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
      
    } catch (error) {
      console.error('업로드 오류:', error);
      setError('업로드 중 오류가 발생했습니다.');
      setUploading(false);
      setProgress(0);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setHashtags('');
    setIsPrivate(false);
    setError('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 모달 닫기
  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-header">
          <h2>파일 업로드</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <div className="upload-content">
          {/* 파일 업로드 영역 */}
          <div 
            className="file-drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {!file ? (
              <div className="drop-zone-label">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <p>클릭하거나 파일을 드래그하여 업로드하세요</p>
                <p>비디오: MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV, M4V, 3GP, TS, MTS, M2TS</p>
                <p>이미지: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG</p>
                <p>최대 파일 크기: {MAX_FILE_SIZE_TEXT}</p>
              </div>
            ) : (
              <div className="file-info">
                <div className="file-info-header">
                  <span className="file-icon">{getFileTypeIcon(file.type)}</span>
                  <div className="file-details">
                    <p><strong>선택된 파일:</strong> {file.name}</p>
                    <p>크기: {formatFileSize(file.size)}</p>
                    <p>형식: {getFileTypeDescription(file.type)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 업로드 진행률 */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span>{Math.round(progress)}%</span>
            </div>
          )}

          {/* 폼 */}
          <form className="upload-form" onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="title">제목 *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="파일 제목을 입력하세요"
                required
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">설명</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="파일에 대한 설명을 입력하세요"
                rows="3"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="hashtags">해시태그</label>
              <input
                type="text"
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#태그1 #태그2 #태그3"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={uploading}
                />
                <span className="checkmark"></span>
                비공개로 설정
              </label>
              <p className="help-text">
                비공개로 설정하면 나만 볼 수 있습니다.
              </p>
            </div>

            {error && (
              <div className="upload-error">
                {error}
              </div>
            )}

            <div className="upload-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={uploading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={uploading || !file || !title.trim()}
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 