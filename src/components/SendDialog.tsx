import React, { useState } from 'react';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (phone: string) => void;
}

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose, onSend }) => {
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove any non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Ensure proper format (remove leading 0 if exists)
    const formattedPhone = cleanPhone.startsWith('0') 
      ? cleanPhone.slice(1) 
      : cleanPhone;
    
    onSend(formattedPhone);
    setPhone('');
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>Send for Signature</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Signer's Phone Number:</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Enter phone number"
              pattern="[0-9+\- ]*"
            />
            <small>Format: 0501234567 or +972501234567</small>
          </div>
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Send via WhatsApp</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendDialog; 