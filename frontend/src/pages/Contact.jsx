import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would be an API call to send the contact form
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setFormStatus({
        submitted: true,
        success: true,
        message: 'Vielen Dank für Ihre Nachricht! Wir melden uns in Kürze bei Ihnen.',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <h1>Kontakt</h1>
        
        <div className="contact-container">
          <div className="contact-info">
            <h2>Kontaktinformationen</h2>
            <div className="info-item">
              <strong>Adresse:</strong>
              <p>Musikstraße 123<br />12345 Musikstadt</p>
            </div>
            <div className="info-item">
              <strong>Telefon:</strong>
              <p>+49 123 456789</p>
            </div>
            <div className="info-item">
              <strong>E-Mail:</strong>
              <p>info@musikverleih.de</p>
            </div>
            <div className="info-item">
              <strong>Öffnungszeiten:</strong>
              <p>
                Montag - Freitag: 9:00 - 18:00 Uhr<br />
                Samstag: 10:00 - 14:00 Uhr<br />
                Sonntag: Geschlossen
              </p>
            </div>
          </div>
          
          <div className="contact-form">
            <h2>Schreiben Sie uns</h2>
            
            {formStatus.submitted && formStatus.success ? (
              <div className="success-message">
                {formStatus.message}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">E-Mail *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Telefon</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Nachricht *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
                  </button>
                </div>
                
                {formStatus.submitted && !formStatus.success && (
                  <div className="error-message">
                    {formStatus.message}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
        
        <div className="map-container">
          <h2>So finden Sie uns</h2>
          <div className="map-placeholder">
            {/* In a real app, you would embed a Google Map or similar here */}
            <div className="map-image">
              Hier würde eine Karte angezeigt werden.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;