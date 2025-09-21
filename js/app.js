class MidnightApesGallery {
    constructor() {
        this.imagesData = [];
        this.metadataCache = new Map();
        this.searchIndex = new Map();
        this.currentPage = 0;
        this.itemsPerPage = 50;
        this.isLoading = false;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.displayedItems = [];
        this.isIndexing = false;
        this.overlayState = 'closed'; // 'closed', 'poem-only', 'image-only'
        this.currentOverlayItem = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderGallery();
    }

    setupEventListeners() {
        // Search functionality with debouncing
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.currentPage = 0;
                this.displayedItems = [];
                this.renderGallery();
            }, 300);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.currentPage = 0;
                this.displayedItems = [];
                this.renderGallery();
            });
        });

        // Start automatic background indexing
        setTimeout(() => this.startBackgroundIndexing(), 2000);

        // Title click for info popup
        document.getElementById('titleClickable').addEventListener('click', () => {
            this.showInfoPopup();
        });

        // Load more button
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });

        // Overlay controls
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.hideOverlay();
        });

        document.getElementById('overlay').addEventListener('click', (e) => {
            if (e.target.id === 'overlay') {
                this.hideOverlay();
            }
        });

        // Click on poem content to show big image
        document.getElementById('poemContent').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.overlayState === 'poem-only') {
                this.showImageOnly();
            }
        });

        // Click on big image to close
        document.getElementById('overlayImage').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.overlayState === 'image-only') {
                this.hideOverlay();
            }
        });

        // Info overlay controls
        document.getElementById('infoCloseBtn').addEventListener('click', () => {
            this.hideInfoPopup();
        });

        document.getElementById('infoOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'infoOverlay') {
                this.hideInfoPopup();
            }
        });

        // Escape key to close overlays
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideOverlay();
                this.hideInfoPopup();
            }
        });
    }

    async loadData() {
        try {
            this.showLoading(true);
            console.log('🔄 Starting to load CSV data...');

            // Load both CSV files directly (for GitHub Pages compatibility)
            const [imagesResponse, metadataResponse] = await Promise.all([
                fetch('data-images.csv'),
                fetch('data-metadata.csv')
            ]);

            console.log('📡 CSV responses received');

            const imagesText = await imagesResponse.text();
            const metadataText = await metadataResponse.text();

            console.log(`📄 CSV loaded - Images: ${imagesText.length} chars, Metadata: ${metadataText.length} chars`);

            // Parse CSV data using the working method from test page
            this.imagesData = this.parseCSV(imagesText, metadataText);

            this.updateCount();
            this.showLoading(false);

            console.log('✅ Data loading complete, starting gallery render...');

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showLoading(false);
            this.showError('Failed to load collection data. CSV files may be missing.');
        }
    }

    parseCSV(imagesText, metadataText) {
        // Use the exact same parsing method that works in the test page
        const imageLines = imagesText.split('\n').slice(1).filter(line => line.trim());
        const metadataLines = metadataText.split('\n').slice(1).filter(line => line.trim());

        const data = [];

        console.log(`📊 Parsing CSV: ${imageLines.length} image lines, ${metadataLines.length} metadata lines`);

        for (let i = 0; i < Math.min(imageLines.length, metadataLines.length); i++) {
            const imageLine = imageLines[i];
            const metadataLine = metadataLines[i];

            if (imageLine && metadataLine) {
                const [imageName, imageUrl] = imageLine.split(',');
                const [metadataName, metadataUrl] = metadataLine.split(',');

                if (imageUrl && metadataUrl) {
                    data.push({
                        id: i,
                        name: imageName?.replace('.jpeg', '').replace('image_', '#'),
                        imageUrl: imageUrl.trim(),
                        metadataUrl: metadataUrl.trim(),
                        loaded: false
                    });
                }
            }
        }

        console.log(`✅ Parsed ${data.length} items successfully`);
        return data;
    }

    // Index metadata for quick searching
    indexMetadata(id, metadata) {
        try {
            let searchableText = '';

            if (metadata.attributes) {
                metadata.attributes.forEach(attr => {
                    if (attr.trait_type && attr.value) {
                        searchableText += `${attr.trait_type.toLowerCase()} ${attr.value.toString().toLowerCase()} `;
                    }
                });
            }

            if (metadata.name) {
                searchableText += metadata.name.toLowerCase() + ' ';
            }
            if (metadata.description) {
                searchableText += metadata.description.toLowerCase() + ' ';
            }

            this.searchIndex.set(id, {
                searchableText: searchableText.trim(),
                metadata: metadata
            });

        } catch (error) {
            console.error('Error indexing metadata for ID', id, error);
        }
    }

    // Background indexing that happens automatically
    async startBackgroundIndexing() {
        if (this.isIndexing) return;

        this.isIndexing = true;
        console.log('🔍 Starting background indexing for search...');

        try {
            const itemsToIndex = this.imagesData.slice(0, 200);

            for (let i = 0; i < itemsToIndex.length; i++) {
                const item = itemsToIndex[i];

                if (!this.searchIndex.has(item.id)) {
                    try {
                        const response = await fetch(item.metadataUrl);
                        const metadata = await response.json();

                        this.metadataCache.set(item.id, metadata);
                        this.indexMetadata(item.id, metadata);

                        await new Promise(resolve => setTimeout(resolve, 100));

                    } catch (error) {
                        console.error(`Error indexing item ${item.id}:`, error);
                    }
                }
            }

            console.log(`✅ Background indexing complete! ${this.searchIndex.size} items ready for search.`);

        } catch (error) {
            console.error('Error during background indexing:', error);
        }

        this.isIndexing = false;
    }

    showMessage(message) {
        const gallery = document.getElementById('gallery');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 1rem;
            background: var(--bg-secondary);
            border-radius: 8px;
            color: var(--accent);
            border: 1px solid var(--border);
            margin-bottom: 1rem;
        `;
        messageDiv.textContent = message;

        gallery.insertBefore(messageDiv, gallery.firstChild);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    getFilteredData() {
        let filtered = this.imagesData;

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(item => {
                if (item.name.toLowerCase().includes(this.searchTerm) ||
                    item.id.toString().includes(this.searchTerm)) {
                    return true;
                }

                const indexedData = this.searchIndex.get(item.id);
                if (indexedData) {
                    return indexedData.searchableText.includes(this.searchTerm);
                }

                return false;
            });
        }

        // Apply collection filter
        if (this.currentFilter === 'random') {
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            filtered = shuffled.slice(0, 100);
        }

        return filtered;
    }

    async renderGallery() {
        const gallery = document.getElementById('gallery');
        const filteredData = this.getFilteredData();

        if (this.currentPage === 0) {
            gallery.innerHTML = '';
            this.displayedItems = [];
        }

        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, filteredData.length);
        const pageItems = filteredData.slice(startIndex, endIndex);

        for (const item of pageItems) {
            const galleryItem = await this.createGalleryItem(item);
            gallery.appendChild(galleryItem);
            this.displayedItems.push(item);
        }

        this.currentPage++;
        this.updateLoadMoreButton(endIndex, filteredData.length);
        this.updateCount();
    }

    async createGalleryItem(item) {
        const div = document.createElement('div');
        div.className = 'gallery-item fade-in';
        div.dataset.id = item.id;

        const img = document.createElement('img');
        img.className = 'gallery-image';
        img.src = item.imageUrl;
        img.alt = item.name;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'gallery-info';
        info.innerHTML = `
            <div class="gallery-title">Midnight Ape</div>
            <div class="gallery-id">${item.name}</div>
        `;

        div.appendChild(img);
        div.appendChild(info);

        // Add click event for overlay - use the working method from test page
        div.addEventListener('click', () => {
            this.handleOverlayClick(item);
        });

        return div;
    }

    // Handle overlay click - simplified like the working test page
    async handleOverlayClick(item) {
        if (this.overlayState === 'closed') {
            // First click: show poem only
            await this.showPoemOverlay(item);
        } else {
            // Click on different item: show poem only
            await this.showPoemOverlay(item);
        }
    }

    async showPoemOverlay(item) {
        try {
            this.showLoading(true, 'Loading...');

            let metadata = this.metadataCache.get(item.id);

            if (!metadata) {
                const response = await fetch(item.metadataUrl);
                metadata = await response.json();
                this.metadataCache.set(item.id, metadata);
                this.indexMetadata(item.id, metadata);
            }

            // Find the lore poem and emoji song in attributes
            const lorePoem = metadata.attributes?.find(attr =>
                attr.trait_type === 'Lore Poem'
            )?.value || 'No lore poem available for this Midnight Ape.';

            const emojiSong = metadata.attributes?.find(attr =>
                attr.trait_type === 'Emoji Song'
            )?.value || '🌑🦧✨';

            // Update overlay content
            document.getElementById('overlayImage').src = item.imageUrl;
            document.getElementById('poemTitle').textContent = emojiSong;
            document.getElementById('poemText').textContent = lorePoem;

            // Show only poem (not image) - exact same as test page
            const overlayContent = document.getElementById('overlayContent');
            overlayContent.classList.remove('image-only');
            document.getElementById('overlayImageContainer').style.display = 'none';
            document.getElementById('poemContent').style.display = 'block';

            document.getElementById('overlay').classList.add('active');
            document.body.style.overflow = 'hidden';

            this.overlayState = 'poem-only';
            this.currentOverlayItem = item;
            this.showLoading(false);

        } catch (error) {
            console.error('Error loading overlay:', error);
            this.showLoading(false);
            this.showError('Failed to load data.');
        }
    }

    showImageOnly() {
        console.log('🔄 Switching to image-only mode...');
        const overlayContent = document.getElementById('overlayContent');
        const imageContainer = document.getElementById('overlayImageContainer');
        const poemContent = document.getElementById('poemContent');

        console.log('Before - imageContainer display:', imageContainer.style.display);
        console.log('Before - poemContent display:', poemContent.style.display);
        console.log('Before - overlayContent classes:', overlayContent.className);

        overlayContent.classList.add('image-only');
        imageContainer.style.display = 'block';
        poemContent.style.display = 'none';

        console.log('After - imageContainer display:', imageContainer.style.display);
        console.log('After - poemContent display:', poemContent.style.display);
        console.log('After - overlayContent classes:', overlayContent.className);

        this.overlayState = 'image-only';
        console.log('✅ Switched to image-only mode');
    }

    hideOverlay() {
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        this.overlayState = 'closed';
        this.currentOverlayItem = null;

        // Reset overlay to default state
        const overlayContent = document.getElementById('overlayContent');
        overlayContent.classList.remove('image-only');
        document.getElementById('overlayImageContainer').style.display = 'block';
        document.getElementById('poemContent').style.display = 'block';
    }

    // Info popup functions
    showInfoPopup() {
        document.getElementById('infoOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideInfoPopup() {
        document.getElementById('infoOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    loadMore() {
        if (!this.isLoading) {
            this.renderGallery();
        }
    }

    updateLoadMoreButton(currentCount, totalCount) {
        const btn = document.getElementById('loadMoreBtn');
        if (currentCount >= totalCount) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
            btn.textContent = `Load More (${currentCount}/${totalCount})`;
        }
    }

    updateCount() {
        const filteredData = this.getFilteredData();
        document.getElementById('currentCount').textContent = this.displayedItems.length;
        document.getElementById('totalCount').textContent = filteredData.length;
    }

    showLoading(show, message = 'Loading Midnight Apes...') {
        const loading = document.getElementById('loadingScreen');
        this.isLoading = show;

        if (show) {
            loading.querySelector('p').textContent = message;
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MidnightApesGallery();
});