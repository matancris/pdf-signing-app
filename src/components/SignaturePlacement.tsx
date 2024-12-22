import React, { useState } from 'react';

interface SignaturePlacementProps {
  isPlacementMode: boolean;
  onPlaceSignature: (position: { x: number; y: number; pageNumber: number }) => void;
  hasSignature: boolean;
  currentPage: number;
}

const SignaturePlacement: React.FC<SignaturePlacementProps> = ({
  isPlacementMode = false,
  onPlaceSignature,
  hasSignature = false,
  currentPage,
}) => {
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  if (!isPlacementMode || hasSignature) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverPosition({ x, y });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onPlaceSignature({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pageNumber: currentPage
    });
  };

  return (
    <div 
      className="signature-placement-area"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverPosition(null)}
    >
      {hoverPosition && (
        <div 
          className="signature-frame"
          style={{
            left: hoverPosition.x,
            top: hoverPosition.y,
          }}
        />
      )}
    </div>
  );
};

export default SignaturePlacement; 