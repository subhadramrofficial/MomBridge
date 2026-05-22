import React from 'react';

const Footer = () => {
  const footerStyle = {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    color: '#777',
    fontSize: '0.9rem',
    borderTop: '1px solid #eee'
  };

  return (
    <footer style={footerStyle}>
      <p>© 2026 MomBridge. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
