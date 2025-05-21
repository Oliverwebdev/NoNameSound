import { useState } from 'react';
import { motion } from 'framer-motion';
import './Contact.css';

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setFormStatus({
        submitted: true,
        success: true,
        message: 'Köszönjük üzenetét! Hamarosan felvesszük Önnel a kapcsolatot.',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('Hiba történt:', error);
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Sajnos hiba történt. Kérjük, próbálja újra később.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Kapcsolat
        </motion.h1>
      </div>
      
      <motion.div 
        className="contact-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="contact-info-card" variants={itemVariants}>
          <div className="card-header">
            <h2>Elérhetőségeink</h2>
          </div>
          <div className="card-content">
            <div className="info-item">
              <div className="icon-wrapper">
                <i className="map-icon"></i>
              </div>
              <div className="info-text">
                <strong>Cím:</strong>
                <p>Budapest terület</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon-wrapper">
                <i className="phone-icon"></i>
              </div>
              <div className="info-text">
                <strong>Telefon:</strong>
                <p>+36 30 994 3215</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon-wrapper">
                <i className="email-icon"></i>
              </div>
              <div className="info-text">
                <strong>E-Mail:</strong>
                <p>nonamesound0@gmail.com</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon-wrapper">
                <i className="service-icon"></i>
              </div>
              <div className="info-text">
                <strong>Szolgáltatások:</strong>
                <p>
                  BÁROK / KLUBOK / ESKÜVŐK<br />
                  SZÜLETÉSNAPOK / RENDEZVÉNYEK
                </p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon-wrapper">
                <i className="delivery-icon"></i>
              </div>
              <div className="info-text">
                <strong>Kiszállítás:</strong>
                <p>BUDAPEST TERÜLETÉN INGYENES KISZÁLLÁS!</p>
              </div>
            </div>
            
            <div className="motto">
              <p>"SZÓLJON, HOGY MINŐSÉG SZÓLJON!"</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div className="contact-form-card" variants={itemVariants}>
          <div className="card-header">
            <h2>Írjon nekünk</h2>
          </div>
          <div className="card-content">
            {formStatus.submitted && formStatus.success ? (
              <motion.div 
                className="success-message"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="success-icon"></div>
                <p>{formStatus.message}</p>
                <button 
                  className="new-message-button"
                  onClick={() => setFormStatus({ submitted: false, success: false, message: '' })}
                >
                  Új üzenet küldése
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Név <span className="required">*</span></label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">E-Mail <span className="required">*</span></label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
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
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Üzenet <span className="required">*</span></label>
                  <motion.textarea
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></motion.textarea>
                </div>
                
                <div className="form-group">
                  <motion.button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting ? (
                      <span className="spinner"></span>
                    ) : (
                      'Üzenet küldése'
                    )}
                  </motion.button>
                </div>
                
                {formStatus.submitted && !formStatus.success && (
                  <motion.div 
                    className="error-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formStatus.message}
                  </motion.div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="qr-section"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="qr-container">
          <div className="qr-text">
            <h3>Termékeinkhez</h3>
            <p>Olvassa be a QR Kódot!</p>
          </div>
          <div className="qr-image">
            {/* QR code placeholder - would be replaced with an actual image */}
            <div className="qr-placeholder"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;