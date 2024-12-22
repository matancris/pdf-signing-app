export const sendWhatsappMessage = (phone: string, signingLink: string) => {
  // Remove any non-numeric characters and ensure proper format
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Make sure phone starts with country code (972)
  const formattedPhone = cleanPhone.startsWith('972') 
    ? cleanPhone 
    : `972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

  const baseUrl = window.location.origin.replace(/\/$/, '');
  const fullSigningLink = `${baseUrl}/sign/${signingLink}`;
  const message = `Please sign this document: ${fullSigningLink}`;
  
  // Create WhatsApp URL
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  
  // Log for debugging
  console.log('Opening WhatsApp with:', {
    phone: formattedPhone,
    message,
    url: whatsappUrl
  });

  // Try different methods to open the link
  try {
    // Method 1: Create and click a link
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to open WhatsApp link:', error);
    
    // Method 2: Direct window.open
    const newWindow = window.open(whatsappUrl, '_blank');
    
    // Method 3: Location change if all else fails
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
  }
}; 