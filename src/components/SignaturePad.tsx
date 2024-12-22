import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

const SignaturePad = ({ onSave }: SignaturePadProps) => {
  const signatureRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSave = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      onSave(signatureData);
    }
  };

  return (
    <div className="signature-pad">
      <SignatureCanvas
        ref={signatureRef}
        canvasProps={{
          className: 'signature-canvas',
          width: 500,
          height: 200,
        }}
      />
      <div className="signature-buttons">
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleSave}>Save Signature</button>
      </div>
    </div>
  );
};

export default SignaturePad; 