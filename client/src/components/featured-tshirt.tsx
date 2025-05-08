import React from 'react';
import { Gift } from 'lucide-react';

/**
 * Exact replica of the t-shirt promotional section
 * Centered design with t-shirt image and button
 */
export function FeaturedTshirt() {
  return (
    <section style={{ backgroundColor: '#80d8f7', padding: '40px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        {/* Section header */}
        <h2 style={{ 
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: 'black'
        }}>
          Featured Products
        </h2>
        
        {/* View all link */}
        <a 
          href="https://rgwrvu-sq.myshopify.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'inline-block',
            color: '#0062cc',
            textDecoration: 'underline',
            fontSize: '16px',
            marginBottom: '20px'
          }}
        >
          View All T-shirts
        </a>
        
        {/* T-shirt image - centered, no box */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img 
            src="/assets/tshirts/nursing-rocks-white-tshirt.jpeg"
            alt="Nursing Rocks! T-shirts"
            style={{ 
              maxWidth: '180px',
              display: 'inline-block'
            }}
          />
        </div>
        
        {/* Pink button with gift icon - centered, fixed width */}
        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
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
              padding: '12px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500',
              width: '100%'
            }}
          >
            <span role="img" aria-label="gift" style={{ marginRight: '8px', fontSize: '18px' }}>🎁</span>
            Nursing Rocks! T-shirts
          </a>
        </div>
      </div>
    </section>
  );
}

export default FeaturedTshirt;