import { WebsiteDemo } from '../types';

// Real Website Catalog: all websites are dynamically loaded from Firestore / Backend
// Zero static mock demos
export const WEBSITE_DEMOS: WebsiteDemo[] = [];

export const SUPPORT_FAQS = [
  {
    q: 'How fast will my website be live after placing an order?',
    a: 'Your website will be configured, personalized with your brand name, phone, and logo, and delivered within 24 hours with full admin credentials.'
  },
  {
    q: 'Can I connect my own custom .com or .xyz domain?',
    a: 'Yes, absolutely! You can connect any domain you already own, or we can assist you in registering a new domain at standard registrar rates.'
  },
  {
    q: 'How does automated bKash/Nagad payment work?',
    a: 'Your store comes integrated with direct merchant checkout workflows, allowing instant order payment validation and transaction tracking in your dashboard.'
  },
  {
    q: 'What kind of support is included with the 1,990 BDT package?',
    a: 'You get 1 full year of managed hosting, complimentary SSL certificate, daily automated backups, and 24/7 technical developer support.'
  }
];

export const TESTIMONIALS: any[] = [];
