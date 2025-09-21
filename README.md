# 🌑 Midnight Apes Gallery

A beautiful, minimalistic website showcasing the Midnight Apes NFT collection with 14,745 unique digital artifacts stored on Arweave. Features an integrated connection to Pizzeria Pirati in Rijeka, Croatia.

## 🚀 Live Demo

Visit the live gallery: **https://f246632.github.io/midnight-apes-gallery/**

## ✨ Features

- **Responsive Grid Layout**: Beautiful masonry-style gallery that adapts to any screen size
- **Interactive Hover Effects**: Smooth animations and preview of lore poems on hover
- **Search & Filter**: Find specific apes by ID or traits
- **Lazy Loading**: Optimized performance with progressive image loading
- **Poem Overlay**: Click any ape to read their full lore poem in an elegant modal
- **Minimalistic Design**: Dark theme with clean typography and smooth animations

## Quick Start

1. **Install Dependencies**:
   ```bash
   cd pirati
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open Your Browser**:
   Navigate to `http://localhost:3000`

## Project Structure

```
pirati/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling and animations
├── js/
│   └── app.js          # Gallery functionality and API calls
├── server.js           # Express server for CSV data and CORS proxy
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## How It Works

1. **Data Loading**: The server reads your CSV files containing Arweave links
2. **Image Display**: Images are loaded progressively in a responsive grid
3. **Metadata Fetching**: When you hover or click, metadata is fetched from Arweave
4. **Poem Display**: Lore poems are extracted from the NFT metadata and displayed

## Technical Details

- **Frontend**: Vanilla JavaScript ES6+ with modern CSS
- **Backend**: Express.js server for file serving and CORS handling
- **Data Source**: CSV files with Arweave URLs
- **Performance**: Lazy loading, caching, and progressive enhancement
- **Responsive**: Mobile-first design with CSS Grid

## CSV File Format

The gallery expects two CSV files:
- `🌑🦧 - images.csv`: Image filenames and Arweave URLs
- `🌑🦧 - JSON Files.csv`: Metadata filenames and Arweave URLs

## Customization

### Colors & Theme
Edit `css/styles.css` and modify the CSS variables:
```css
:root {
    --bg-primary: #0a0a0a;    /* Main background */
    --accent: #4a9eff;        /* Accent color */
    --text-primary: #ffffff;   /* Main text */
}
```

### Layout
Adjust the grid in `css/styles.css`:
```css
.gallery {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}
```

### Loading Behavior
Modify `itemsPerPage` in `js/app.js`:
```javascript
this.itemsPerPage = 50; // Items to load per batch
```

## Development

For development with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## Foundation for Pizza Shop Project

This gallery serves as the foundation for your pizza shop project by providing:

- **Asset Management**: System for handling large collections of images and metadata
- **Responsive UI**: Modern, mobile-friendly interface patterns
- **Data Loading**: Efficient strategies for loading and displaying large datasets
- **Interactive Elements**: Hover effects and modal patterns for product showcases
- **Performance Optimization**: Lazy loading and caching patterns

Perfect starting point for evolving into a pizza shop interface where:
- Midnight Apes → Pizza varieties
- Lore poems → Pizza descriptions/ingredients
- NFT metadata → Product information
- Gallery grid → Menu layout

## License

MIT License - feel free to modify and use for your pizza shop project!