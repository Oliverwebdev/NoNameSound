import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './NotFound.css';

const NotFound = ({ adminView = false }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5, 
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

  const floatVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -15, 0], 
      transition: { 
        duration: 3, 
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className="not-found-page">
      <motion.div 
        className="container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="vinyl-record"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="vinyl-center"></div>
        </motion.div>
        
        <motion.div 
          className="error-code"
          variants={floatVariants}
          initial="initial"
          animate="animate"
        >
          404
        </motion.div>
        
        <motion.h1 variants={itemVariants}>
          Seite nicht gefunden
        </motion.h1>
        
        <motion.p variants={itemVariants}>
          Die gesuchte Seite existiert leider nicht.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          {adminView ? (
            <Link to="/admin" className="return-link">
              <motion.span 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="link-text"
              >
                Zurück zum Admin-Dashboard
              </motion.span>
            </Link>
          ) : (
            <Link to="/" className="return-link">
              <motion.span 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="link-text"
              >
                Zurück zur Startseite
              </motion.span>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;