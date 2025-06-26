import React, { useState } from 'react';
import './GlobalSettings.css';
import { SettingsIcon, QualityIcon, EyeIcon, EyeOffIcon } from '../icons/Icons';
import { VIDEO_QUALITY_OPTIONS, PRIVACY_OPTIONS } from '../utils/helpers';

const GlobalSettings = ({ 
  videoQuality, 
  setVideoQuality, 
  defaultPrivacy, 
  setDefaultPrivacy,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('quality');

  return (
    <div className="global-settings-overlay">
      <div className="global-settings-modal">
        <div className="settings-header">
          <h2>전역 설정</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'quality' ? 'active' : ''}`}
            onClick={() => setActiveTab('quality')}
          >
            <QualityIcon />
            <span>화질 설정</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <EyeIcon />
            <span>공개 설정</span>
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'quality' && (
            <div className="quality-settings">
              <h3>기본 비디오 화질</h3>
              <p className="settings-description">
                업로드할 비디오의 기본 화질을 설정합니다.
              </p>
              
              <div className="quality-options">
                {VIDEO_QUALITY_OPTIONS.map((option) => (
                  <label key={option.value} className="quality-option">
                    <input
                      type="radio"
                      name="videoQuality"
                      value={option.value}
                      checked={videoQuality === option.value}
                      onChange={(e) => setVideoQuality(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-header">
                        <span className="option-label">{option.label}</span>
                        {videoQuality === option.value && (
                          <span className="selected-indicator">✓</span>
                        )}
                      </div>
                      <span className="option-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'privacy' && (
            <div className="privacy-settings">
              <h3>기본 공개 설정</h3>
              <p className="settings-description">
                업로드할 비디오의 기본 공개 범위를 설정합니다.
              </p>
              
              <div className="privacy-options">
                {PRIVACY_OPTIONS.map((option) => (
                  <label key={option.value} className="privacy-option">
                    <input
                      type="radio"
                      name="defaultPrivacy"
                      value={option.value}
                      checked={defaultPrivacy === option.value}
                      onChange={(e) => setDefaultPrivacy(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-header">
                        <span className="option-label">{option.label}</span>
                        {defaultPrivacy === option.value && (
                          <span className="selected-indicator">✓</span>
                        )}
                      </div>
                      <span className="option-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn-primary" onClick={onClose}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings; 