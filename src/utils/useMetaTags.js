import { useEffect } from 'react';

export const useMetaTags = ({ 
  title, 
  description, 
  image, 
  url,
  type = 'website',
  siteName = 'CivilsCoach',
  twitterCard = 'summary_large_image'
}) => {
  useEffect(() => {
    // Store original values for cleanup
    const originalTitle = document.title;
    const metaElements = [];

    // Helper function to update or create meta tags
    const updateMetaTag = (selector, content, attribute = 'content') => {
      let meta = document.querySelector(selector);
      const originalContent = meta?.getAttribute(attribute);
      
      if (meta) {
        meta.setAttribute(attribute, content);
        metaElements.push({ element: meta, originalValue: originalContent, attribute });
      } else {
        // Create new meta tag if it doesn't exist
        meta = document.createElement('meta');
        
        // Determine if it's property or name based on selector
        if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)?.[1];
          if (property) {
            meta.setAttribute('property', property);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
            metaElements.push({ element: meta, isNew: true });
          }
        } else if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) {
            meta.setAttribute('name', name);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
            metaElements.push({ element: meta, isNew: true });
          }
        }
      }
    };

    // Update document title
    if (title) {
      document.title = title;
    }

    // Update basic meta tags
    if (description) {
      updateMetaTag('meta[name="description"]', description);
    }

    // Update Open Graph tags
    if (title) {
      updateMetaTag('meta[property="og:title"]', title);
    }
    
    if (description) {
      updateMetaTag('meta[property="og:description"]', description);
    }
    
    if (image) {
      updateMetaTag('meta[property="og:image"]', image);
    }
    
    if (url) {
      updateMetaTag('meta[property="og:url"]', url);
    }
    
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:site_name"]', siteName);

    // Update Twitter Card tags
    updateMetaTag('meta[property="twitter:card"]', twitterCard);
    
    if (title) {
      updateMetaTag('meta[property="twitter:title"]', title);
    }
    
    if (description) {
      updateMetaTag('meta[property="twitter:description"]', description);
    }
    
    if (image) {
      updateMetaTag('meta[property="twitter:image"]', image);
    }
    
    if (url) {
      updateMetaTag('meta[property="twitter:url"]', url);
    }

    // Cleanup function to restore original values
    return () => {
      document.title = originalTitle;
      
      metaElements.forEach(({ element, originalValue, attribute, isNew }) => {
        if (isNew) {
          element.remove();
        } else if (originalValue !== null) {
          element.setAttribute(attribute, originalValue);
        }
      });
    };
  }, [title, description, image, url, type, siteName, twitterCard]);
};

// Export default meta tags for the main site
export const defaultMetaTags = {
  title: 'CivilsCoach - UPSC Preparation Platform',
  description: 'Master UPSC Civil Services preparation with comprehensive test platform. Practice with real exam questions, track progress, and achieve your goals.',
  image: 'https://civilscoach.com/og-image.jpg',
  url: 'https://civilscoach.com/',
  siteName: 'CivilsCoach'
};