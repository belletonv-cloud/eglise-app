import { chromium } from 'playwright-core';
import { execSync } from 'child_process';

// Find playwright browsers
const browserPath = execSync('npx playwright install --dry-run 2>&1 || true', { encoding: 'utf8' });

async function scrapePage(url, pageFn) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'fr-FR',
  });
  await context.addCookies([{ name: 'CookieConsent', value: 'accepted', domain: '.cieuxouverts.bzh', path: '/' }]);
  const page = await context.newPage();
  
  console.log(`🌐 Loading ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  const result = await page.evaluate(pageFn);
  await browser.close();
  return result;
}

async function main() {
  const results = {};

  // Scrape homepage
  results.homepage = await scrapePage('https://www.cieuxouverts.bzh', () => {
    const data = {};
    
    // Get all visible text content
    const body = document.body.innerText;
    
    // Extract address
    const addressMatch = body.match(/[\d]+\s+rue\s+[^|]+/i);
    data.address = addressMatch ? addressMatch[0].trim() : null;
    
    // Extract service times
    const timeMatch = body.match(/(\d+h\d+)\s*(Célébration|Accueil)/gi);
    data.serviceTimes = timeMatch || [];
    
    // Extract aspirations/missions
    const aspirations = body.match(/Accueillir.*?|Célébrer.*?|Accompagner.*?|Témoigner.*?/g);
    data.aspirations = aspirations || [];
    
    // Extract vision/mission statement
    const visionMatch = body.match(/Voir la gloire.*?/i);
    data.vision = visionMatch ? visionMatch[0].trim() : null;
    
    // Extract social links
    const fbLinks = [...document.querySelectorAll('a[href*="facebook"]')].map(a => a.href);
    const ytLinks = [...document.querySelectorAll('a[href*="youtube"]')].map(a => a.href);
    const igLinks = [...document.querySelectorAll('a[href*="instagram"]')].map(a => a.href);
    data.social = { facebook: fbLinks, youtube: ytLinks, instagram: igLinks };
    
    // Extract contact email
    const emailMatch = body.match(/[\w.]+@cieuxouverts\.bzh/g);
    data.email = emailMatch ? [...new Set(emailMatch)] : [];
    
    // Extract newsletter info
    data.hasNewsletter = body.toLowerCase().includes('newsletter');
    
    // Extract full text for reference
    data.rawText = body.substring(0, 2000);
    
    return data;
  });

  // Scrape agenda page
  results.agenda = await scrapePage('https://www.cieuxouverts.bzh/agenda', () => {
    const body = document.body.innerText;
    
    // Look for event data
    const events = [];
    
    // Try to find event-like elements
    const eventElements = document.querySelectorAll('[class*="event"], [class*="calendar"], [class*="agenda"]');
    eventElements.forEach(el => {
      const text = el.innerText.trim();
      if (text.length > 10 && text.length < 500) {
        events.push(text);
      }
    });
    
    // Also check for any date-like patterns
    const datePatterns = body.match(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*\d{4}/gi);
    
    return {
      hasEvents: events.length > 0,
      events: events.slice(0, 20),
      dates: datePatterns || [],
      rawText: body.substring(0, 3000),
    };
  });

  // Scrape messages page
  results.messages = await scrapePage('https://www.cieuxouverts.bzh/messages', () => {
    const body = document.body.innerText;
    
    // Look for sermon/message data
    const messages = [];
    const msgElements = document.querySelectorAll('[class*="message"], [class*="sermon"], [class*="predication"]');
    msgElements.forEach(el => {
      const text = el.innerText.trim();
      if (text.length > 10) {
        messages.push(text);
      }
    });
    
    // Look for YouTube links
    const ytLinks = [...document.querySelectorAll('a[href*="youtube"]')].map(a => a.href);
    
    return {
      hasMessages: messages.length > 0,
      messages: messages.slice(0, 20),
      youtubeLinks: ytLinks,
      rawText: body.substring(0, 3000),
    };
  });

  // Scrape event list / billetterie
  results.events = await scrapePage('https://www.cieuxouverts.bzh/event-list', () => {
    const body = document.body.innerText;
    const eventItems = [];
    
    const items = document.querySelectorAll('[class*="event"], [class*="ticket"], [class*="billet"]');
    items.forEach(el => {
      const text = el.innerText.trim();
      if (text.length > 10 && text.length < 500) {
        eventItems.push(text);
      }
    });
    
    return {
      hasEvents: eventItems.length > 0,
      events: eventItems.slice(0, 20),
      rawText: body.substring(0, 2000),
    };
  });

  // Scrape contact page
  results.contact = await scrapePage('https://www.cieuxouverts.bzh/contact', () => {
    const body = document.body.innerText;
    
    const addressMatch = body.match(/[\d]+\s+rue\s+[^\\n]+/i);
    const phoneMatch = body.match(/[\d\s.-]{10,}/);
    
    return {
      address: addressMatch ? addressMatch[0].trim() : null,
      phone: phoneMatch ? phoneMatch[0].trim() : null,
      rawText: body.substring(0, 1500),
    };
  });

  console.log('\n📊 Résultats complets:\n');
  console.log(JSON.stringify(results, null, 2));
  
  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('cieuxouverts_data.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Données sauvegardées dans cieuxouverts_data.json');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
