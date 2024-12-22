import React from 'react';
import { SignedPDF } from '../types/types';

interface SentPDFsListProps {
  pdfs: SignedPDF[];
  onViewPDF: (pdf: SignedPDF) => void;
  onDownloadPDF: (pdf: SignedPDF) => void;
  onDeletePDF: (pdf: SignedPDF) => void;
}

const SentPDFsList: React.FC<SentPDFsListProps> = ({
  pdfs,
  onViewPDF,
  onDownloadPDF,
  onDeletePDF,
}) => {
  return (
    <div className="sent-pdfs-list">
      <h2>Sent Documents</h2>
      <div className="pdfs-grid">
        {pdfs.map((pdf) => (
          <div key={pdf.id} className="pdf-card">
            <div className="pdf-info">
              <h3>Signer: {pdf.signerName}</h3>
              <p>Status: <span className={`status ${pdf.status}`}>{pdf.status}</span></p>
              <p>Date Sent: {new Date(pdf.dateSent).toLocaleDateString()}</p>
            </div>
            <div className="pdf-actions">
              <button onClick={() => onViewPDF(pdf)}>View</button>
              {pdf.status === 'signed' && (
                <button onClick={() => onDownloadPDF(pdf)}>Download</button>
              )}
              {pdf.status === 'pending' && (
                <button 
                  onClick={() => onDeletePDF(pdf)}
                  className="delete-button"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentPDFsList; 