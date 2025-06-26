import React from 'react';
import './SearchPage.css';

function SearchPage() {
  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-input-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            placeholder="비디오, 사용자, 해시태그 검색..."
            className="search-input"
          />
        </div>
      </div>

      <div className="search-content">
        <div className="search-empty">
          <div className="empty-icon">🔍</div>
          <h3>검색 기능 준비 중</h3>
          <p>곧 검색 기능을 사용할 수 있습니다!</p>
        </div>
      </div>
    </div>
  );
}

export default SearchPage; 