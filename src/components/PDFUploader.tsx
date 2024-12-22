import React from 'react';

interface PDFUploaderProps {
  onUpload: (url: string) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onUpload(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pdf-uploader">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default PDFUploader; 