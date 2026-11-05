import { config, collection, singleton, fields } from '@keystatic/core';
import { videos, countries } from './src/data/site';

// Admin for Rotary World Help. Every save is a commit to GitHub; Vercel rebuilds the site in about a minute.
// Locally (npm run dev) it edits the files on disk instead.
const isProd = !!import.meta.env?.PROD;

const photo = (label: string, dir: string, description?: string) =>
  fields.image({ label, description, directory: `public/uploads/${dir}`, publicPath: `/uploads/${dir}/` });

export default config({
  storage: isProd ? { kind: 'github', repo: 'Oleh81/Rotary-' } : { kind: 'local' },
  ui: {
    brand: { name: 'Rotary World Help' },
    navigation: {
      'Publish': ['news', 'loadings', 'events', 'documents'],
      'About us': ['directors', 'clubs'],
      'Site settings': ['pages', 'settings'],
    },
  },
  collections: {
    news: collection({
      label: 'News & stories',
      slugField: 'title',
      path: 'src/content/news/*/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true, length: { max: 120 } } },
          slug: { label: 'Web address', description: 'Filled in automatically from the title. Do not change it after publishing, or old links will break.' },
        }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
        summary: fields.text({ label: 'Short summary', multiline: true, validation: { length: { max: 200 } },
          description: 'One or two sentences shown on the news page, on social media and in Google. If empty, the first paragraph is used.' }),
        cover: photo('Cover photo', 'news', 'The big photo at the top of the story. A wide (landscape) photo works best. Any size is fine: it is compressed automatically.'),
        coverAlt: fields.text({ label: 'Describe the cover photo', description: 'For blind visitors and Google, e.g. "Volunteers loading a container in Coquitlam". Leave empty if the photo is only decorative.' }),
        body: fields.markdoc({
          label: 'Story',
          description: 'Write the story here. Use the toolbar for headings, bold, lists, quotes and links.',
          options: { image: false, table: false, codeBlock: false, code: false, strikethrough: false, divider: true },
        }),
        photos: fields.array(
          fields.object({
            image: photo('Photo', 'news'),
            caption: fields.text({ label: 'Caption (optional)' }),
          }),
          { label: 'Photo gallery', description: 'Photos shown under the story. Drag to change the order.', itemLabel: p => p.fields.caption.value || 'Photo' },
        ),
        youtube: fields.url({ label: 'YouTube video (optional)', description: 'Paste a YouTube link, e.g. https://www.youtube.com/watch?v=… It appears above the story.' }),
        videos: fields.multiselect({
          label: 'Videos from our video library (optional)',
          options: Object.entries(videos).map(([value, v]) => ({ label: v.title, value })),
        }),
      },
    }),

    loadings: collection({
      label: 'Container loadings',
      path: 'src/content/loadings/*',
      format: { data: 'json' },
      slugField: 'title',
      columns: ['date', 'country'],
      schema: {
        title: fields.slug({ name: { label: 'Name', description: 'For example: Honduras March 2026', validation: { isRequired: true } }, slug: { label: 'File name', description: 'Filled in automatically from the name.' } }),
        date: fields.date({ label: 'Loading date', validation: { isRequired: true } }),
        country: fields.select({ label: 'Destination country', description: 'The loading appears on the globe, in the gallery and on this country\'s page.',
          options: [...countries].sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ label: c.name, value: c.name })), defaultValue: 'Ukraine' }),
        sponsor: fields.text({ label: 'Sponsor', description: 'Club or organisation that sponsored the container, e.g. Port Moody Rotary Club' }),
        story: fields.text({ label: 'Text (optional)', multiline: true, description: 'A few lines about this container: what was in it, who it is for. Shown on the album page.' }),
        drive: fields.url({ label: 'Google Drive folder with all photos and videos (optional)',
          description: 'Best for many photos. In Google Drive: right-click the folder → Share → General access: "Anyone with the link" → Copy link, and paste it here. Every photo and video in the folder appears on the album page a minute or two after you save.' }),
        photos: fields.array(
          fields.object({ image: photo('Photo', 'loadings'), caption: fields.text({ label: 'Caption (optional)' }) }),
          { label: 'Photos', description: 'Upload any size; the site compresses them. Drag to change the order.', itemLabel: p => p.fields.caption.value || 'Photo' },
        ),
        imported: fields.array(fields.text({ label: 'Photo number' }), {
          label: 'Photos imported from the old site', description: 'Numbers of photos moved from rotaryworldhelp.com. Delete a line to hide that photo; new photos go in "Photos" above.', itemLabel: p => p.value || 'Photo' }),
      },
    }),
    events: collection({
      label: 'Calendar events',
      slugField: 'title',
      path: 'src/content/events/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Event name', validation: { isRequired: true } } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        time: fields.text({ label: 'Start time (optional)', description: 'For example: 9:00 am' }),
        description: fields.text({ label: 'Description', multiline: true }),
        link: fields.text({ label: 'Link (optional)', description: 'A news story (e.g. /news/rwh-agm-june-6-2026) or a full web address.' }),
      },
    }),

    documents: collection({
      label: 'Newsletters & reports',
      slugField: 'title',
      path: 'src/content/documents/*',
      format: { data: 'json' },
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title', description: 'For example: Spring 2026 or 2025 Annual Report', validation: { isRequired: true } } }),
        kind: fields.select({ label: 'Type', options: [{ label: 'Newsletter', value: 'newsletter' }, { label: 'Annual report', value: 'report' }], defaultValue: 'newsletter' }),
        date: fields.date({ label: 'Date', description: 'Used to sort the list, newest first.', validation: { isRequired: true } }),
        file: fields.file({ label: 'Upload the file (PDF or Word)', directory: 'public/docs/uploads', publicPath: '/docs/uploads/' }),
        link: fields.text({ label: '…or link to it instead', description: 'Use this for a YouTube video, a news story (/news/…) or a file stored elsewhere.' }),
        note: fields.text({ label: 'Note (optional)', description: 'Shown under the title, e.g. "AGM held May 3, 2024".' }),
      },
    }),

    directors: collection({
      label: 'Directors',
      slugField: 'name',
      path: 'src/content/directors/*',
      format: { data: 'json' },
      columns: ['name', 'role'],
      schema: {
        name: fields.slug({ name: { label: 'Name', validation: { isRequired: true } } }),
        role: fields.text({ label: 'Role', description: 'For example: Treasurer and Director' }),
        club: fields.text({ label: 'Rotary club' }),
        photo: photo('Photo', 'directors', 'A portrait (head and shoulders) works best.'),
        order: fields.integer({ label: 'Position on the page', description: 'Smaller numbers come first. Use 10, 20, 30… so you can fit someone in between later.', defaultValue: 100 }),
      },
    }),
  },

  singletons: {
    clubs: singleton({
      label: 'Member clubs',
      path: 'src/content/clubs',
      format: { data: 'json' },
      schema: {
        clubs: fields.array(
          fields.object({
            name: fields.text({ label: 'Club name', validation: { isRequired: true } }),
            founding: fields.checkbox({ label: 'Founding member' }),
            website: fields.url({ label: 'Club website (optional)', description: 'If filled in, the club name becomes a link on the Member clubs page.' }),
          }),
          { label: 'Clubs', itemLabel: c => c.fields.name.value || 'New club', description: 'Drag to reorder. The page shows them in this order.' },
        ),
      },
    }),

    pages: singleton({
      label: 'Page headlines',
      path: 'src/content/pages',
      format: { data: 'json' },
      schema: {
        'home': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Home' }),
        'calendar': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Calendar' }),
        'contact': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Contact' }),
        'countries': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Countries' }),
        'directors': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Directors' }),
        'donate': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Donate' }),
        'gallery': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true, description: 'Leave empty to show the automatic count of loadings and albums.' }) }, { label: 'Gallery' }),
        'get-involved': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Get involved' }),
        'join': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'How clubs can join' }),
        'member-clubs': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Member clubs' }),
        'news': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'News' }),
        'newsletters': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Newsletters and reports' }),
        'our-impact': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Our impact' }),
        'our-story': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Our story' }),
        'request-aid': fields.object({ title: fields.text({ label: 'Headline', validation: { isRequired: true, length: { max: 110 } } }), lead: fields.text({ label: 'Text under the headline', multiline: true }) }, { label: 'Request for aid' }),
      },
    }),

    settings: singleton({
      label: 'Key figures, contacts & banner',
      path: 'src/content/settings',
      format: { data: 'json' },
      schema: {
        stats: fields.object({
          containers: fields.integer({ label: 'Containers shipped', validation: { isRequired: true, min: 0 } }),
          countries: fields.integer({ label: 'Countries reached', validation: { isRequired: true, min: 0 } }),
          valueMillions: fields.integer({ label: 'Value shipped (millions of dollars)', validation: { isRequired: true, min: 0 } }),
          peopleMillions: fields.integer({ label: 'People helped (millions)', validation: { isRequired: true, min: 0 } }),
        }, { label: 'Key figures', description: 'The big counters on the home page and the Impact page.' }),
        contact: fields.object({
          email: fields.text({ label: 'Email', validation: { isRequired: true } }),
          phone: fields.text({ label: 'Phone', description: 'Written as you want it shown, e.g. 604-308-2257', validation: { isRequired: true } }),
        }, { label: 'Contact details' }),
        donateUrl: fields.url({ label: 'Donate button link', description: 'Where every Donate button goes (CanadaHelps).', validation: { isRequired: true } }),
        announcement: fields.object({
          show: fields.checkbox({ label: 'Show the banner', description: 'A thin bar at the very top of every page.' }),
          text: fields.text({ label: 'Banner text', description: 'Short, e.g. "Next container loading: Saturday, June 14 at 9 am"', validation: { length: { max: 140 } } }),
          link: fields.text({ label: 'Banner link (optional)' }),
          linkLabel: fields.text({ label: 'Link text', defaultValue: 'Learn more' }),
        }, { label: 'Announcement banner' }),
      },
    }),
  },
});
