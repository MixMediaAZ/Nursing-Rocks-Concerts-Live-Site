import React from 'react';

/**
 * Exact replica of the t-shirt promotional section
 * This component aims to match the screenshot precisely
 */
export function FeaturedTshirt() {
  return (
    <section style={{ backgroundColor: '#80d8f7', paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: 'black'
        }}>
          Featured Products
        </h2>
        
        <a 
          href="https://rgwrvu-sq.myshopify.com/" 
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#0000EE', 
            textDecoration: 'underline', 
            display: 'inline-block',
            marginBottom: '24px',
            fontSize: '16px'
          }}
        >
          View All T-shirts
        </a>
        
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img 
            src="/assets/tshirts/nursing-rocks-white-tshirt.jpeg"
            alt="Nursing Rocks! T-shirts"
            style={{ 
              maxWidth: '200px',
              display: 'inline-block'
            }}
          />
        </div>
        
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <a
            href="https://rgwrvu-sq.myshopify.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F61D7A',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: '500',
              gap: '8px'
            }}
          >
            <span style={{ display: 'inline-flex', marginRight: '8px' }}>🎁</span>
            Nursing Rocks! T-shirts
          </a>
        </div>
      </div>
    </section>
  );
}

export default FeaturedTshirt;