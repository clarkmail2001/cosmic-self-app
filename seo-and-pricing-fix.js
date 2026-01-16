// SEO and Pricing Fix for Cosmic Self
// This script injects SEO meta tags and updates pricing dynamically

(function() {
      'use strict';

     // ============ SEO META TAGS ============
     const seoTags = [
       { name: 'description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings. Get your free birth chart analysis, life path number, moon phase guidance, and planetary transits.' },
       { name: 'keywords', content: 'astrology, numerology, birth chart, horoscope, zodiac, life path number, moon phases, Chinese zodiac, cosmic guidance, planetary transits, natal chart, sun sign, moon sign, rising sign' },
       { name: 'author', content: 'Cosmic Self' },
       { name: 'robots', content: 'index, follow' },
       { property: 'og:type', content: 'website' },
       { property: 'og:url', content: 'https://cosmic-self-app-production.up.railway.app/' },
       { property: 'og:title', content: 'Cosmic Self | Know Your Place in the Universe' },
       { property: 'og:description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings. Free birth chart analysis and life path guidance.' },
       { name: 'twitter:card', content: 'summary_large_image' },
       { name: 'twitter:title', content: 'Cosmic Self | Know Your Place in the Universe' },
       { name: 'twitter:description', content: 'Discover your cosmic blueprint with personalized astrology, numerology, and Chinese zodiac readings.' }
           ];

     // Inject SEO meta tags
     seoTags.forEach(function(tag) {
               var meta = document.createElement('meta');
               if (tag.name) meta.setAttribute('name', tag.name);
               if (tag.property) meta.setAttribute('property', tag.property);
               meta.setAttribute('content', tag.content);
               document.head.appendChild(meta);
     });

     // Add canonical link
     var canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://cosmic-self-app-production.up.railway.app/');
      document.head.appendChild(canonical);

     // Add structured data
     var structuredData = document.createElement('script');
      structuredData.type = 'application/ld+json';
      structuredData.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Cosmic Self",
                "description": "Personalized astrology, numerology, and Chinese zodiac readings",
                "url": "https://cosmic-self-app-production.up.railway.app/",
                "applicationCategory": "Lifestyle",
                "offers": {
                              "@type": "AggregateOffer",
                              "lowPrice": "0",
                              "highPrice": "15",
                              "priceCurrency": "USD"
                }
      });
      document.head.appendChild(structuredData);

     console.log('SEO meta tags injected successfully');
})();
