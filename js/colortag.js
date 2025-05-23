class ColorTag {
    constructor(options = {}) {
        // macOS Finder-like colors with names
        this.defaultColors = [
            { name: 'Gray', color: '#c8c8c8' },
            { name: 'Red', color: '#ec8383' },
            { name: 'Orange', color: '#f7be71' },
            { name: 'Yellow', color: '#fefd88' },
            { name: 'Green', color: '#9ed881' },
            { name: 'Blue', color: '#84cdef' },
            { name: 'Purple', color: '#ca99de' }
        ];
        
        // If custom colors are provided, ensure they have names
        if (options.colors) {
            this.colors = this._processColors(options.colors);
        } else {
            this.colors = this.defaultColors;
        }
        
        this.taggableItemClass = options.taggableItemClass || 'taggable-item';
        this.itemTagsClass = options.itemTagsClass || 'item-tags';
        this.activePalette = null; // Keep track of the currently active item palette
        
        // Custom event callbacks
        this.eventCallbacks = {
            tagAdded: [],
            tagRemoved: []
        };
    }

    // Process and normalize colors - ensure each has name and color properties
    _processColors(colors) {
        return colors.map(color => {
            // If the color is already in object format with name and color
            if (typeof color === 'object' && color.name && color.color) {
                return color;
            }
            // If it's just a color string, generate a name
            return { 
                name: this._generateColorName(color), 
                color: color 
            };
        });
    }

    // Generate a simple name for a color if none provided
    _generateColorName(colorValue) {
        // Try to match with common color names
        const commonColors = {
            '#ff0000': 'Red',
            '#00ff00': 'Green',
            '#0000ff': 'Blue',
            '#ffff00': 'Yellow',
            '#00ffff': 'Cyan',
            '#ff00ff': 'Magenta',
            '#ffffff': 'White',
            '#000000': 'Black',
            '#808080': 'Gray'
        };
        
        const lowerColor = colorValue.toLowerCase();
        if (commonColors[lowerColor]) {
            return commonColors[lowerColor];
        }
        
        // If not a common color, use the hex value as the name
        return colorValue.replace('#', 'Color_');
    }

    /**
     * Initialize the ColorTag library
     * @param {string|object|null} selectorOrOptions - CSS selector string or options object with colors property
     * @param {Array|null} colors - Optional color array to use for this initialization
     * @returns {number} The number of elements initialized
     */
    init(selectorOrOptions = null, colors = null) {
        let selector = null;
        let initColors = null;
        
        // Check if the first parameter is an object with a colors property
        if (selectorOrOptions && typeof selectorOrOptions === 'object' && !Array.isArray(selectorOrOptions)) {
            initColors = selectorOrOptions.colors || null;
            selector = selectorOrOptions.selector || null;
        } else {
            // First parameter is a selector string or null
            selector = selectorOrOptions;
            initColors = colors;
        }
        
        // If colors were provided, process and set them for this initialization
        if (initColors) {
            this.colors = this._processColors(initColors);
        }
        
        let items;
        
        if (selector) {
            // If a selector is provided, use it
            items = document.querySelectorAll(selector);
            
            // Add the taggable class to these elements if they don't have it
            items.forEach(item => {
                if (!item.classList.contains(this.taggableItemClass)) {
                    item.classList.add(this.taggableItemClass);
                }
                
                // Ensure there's a container for tags
                let tagsContainer = item.querySelector(`.${this.itemTagsClass}`);
                if (!tagsContainer) {
                    tagsContainer = document.createElement('div');
                    tagsContainer.classList.add(this.itemTagsClass);
                    item.appendChild(tagsContainer);
                }
            });
        } else {
            // Otherwise, use the default class
            items = document.querySelectorAll(`.${this.taggableItemClass}`);
        }
        
        // Setup each item
        items.forEach(item => {
            this.setupItemInteractions(item);
            
            // Process initial tags from data attributes
            this.processInitialTags(item);
        });

        // Single document-level listener to close active palette on outside click/touch
        document.addEventListener('click', this.handleOutsideClick.bind(this), true); // Use capture phase
        document.addEventListener('touchstart', this.handleOutsideClick.bind(this), { passive: false, capture: true });
        
        return items.length; // Return the number of initialized items
    }
    
    /**
     * Process initial tags defined via data attributes
     * @param {HTMLElement} itemElement - The element to process for initial tags
     */
    processInitialTags(itemElement) {
        // Check for data-initial-tags attribute (comma-separated list of color values or names)
        const initialTagsAttr = itemElement.dataset.initialTags;
        
        if (initialTagsAttr) {
            const tagValues = initialTagsAttr.split(',').map(tag => tag.trim());
            
            tagValues.forEach(tagValue => {
                // Try to find matching color by name (case insensitive)
                let matchedColor = this.colors.find(c => 
                    c.name.toLowerCase() === tagValue.toLowerCase());
                
                // If not found by name, try by color value
                if (!matchedColor) {
                    matchedColor = this.colors.find(c => 
                        c.color.toLowerCase() === tagValue.toLowerCase());
                }
                
                // If a matching color was found, apply it
                if (matchedColor) {
                    this.addTagToItem(itemElement, matchedColor, false); // false = don't trigger event (optional)
                } else {
                    console.warn(`ColorTag: Initial tag value '${tagValue}' not found in color palette`);
                }
            });
        }
    }

    // API Event handling methods
    on(eventName, callback) {
        if (this.eventCallbacks[eventName]) {
            this.eventCallbacks[eventName].push(callback);
            return true;
        }
        return false;
    }

    off(eventName, callback) {
        if (this.eventCallbacks[eventName]) {
            this.eventCallbacks[eventName] = this.eventCallbacks[eventName].filter(cb => cb !== callback);
            return true;
        }
        return false;
    }

    _dispatchEvent(eventName, eventData) {
        if (this.eventCallbacks[eventName]) {
            this.eventCallbacks[eventName].forEach(callback => {
                try {
                    callback(eventData);
                } catch (error) {
                    console.error(`Error in ${eventName} event callback:`, error);
                }
            });
        }
    }

    handleOutsideClick(e) {
        if (this.activePalette) {
            const paletteElement = this.activePalette.paletteEl;
            const triggerButton = this.activePalette.triggerEl;

            // Check if the click is outside the palette and not on its trigger button
            if (paletteElement && triggerButton && !paletteElement.contains(e.target) && !triggerButton.contains(e.target)) {
                this.toggleItemPalette(this.activePalette.itemEl, paletteElement, false); // Force hide
            }
        }
    }

    setupItemInteractions(itemElement) {
        const addTagButton = document.createElement('button');
        addTagButton.classList.add('item-add-tag-button');
        
        // Add accessibility attributes
        addTagButton.setAttribute('aria-label', 'Add color tag');
        addTagButton.setAttribute('aria-expanded', 'false');
        addTagButton.setAttribute('aria-haspopup', 'true');
        
        // Create SVG for plus icon
        const plusSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        plusSvg.setAttribute('viewBox', '0 0 24 24');
        plusSvg.setAttribute('width', '16');
        plusSvg.setAttribute('height', '16');
        plusSvg.setAttribute('aria-hidden', 'true'); // Hide from screen readers since button has label
        plusSvg.classList.add('plus-icon');
        
        const plusCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        plusCircle.setAttribute('cx', '12');
        plusCircle.setAttribute('cy', '12');
        plusCircle.setAttribute('r', '10');
        plusCircle.setAttribute('fill', 'none');
        plusCircle.setAttribute('stroke', 'currentColor');
        plusCircle.setAttribute('stroke-width', '2');
        
        const plusVertical = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        plusVertical.setAttribute('x1', '12');
        plusVertical.setAttribute('y1', '8');
        plusVertical.setAttribute('x2', '12');
        plusVertical.setAttribute('y2', '16');
        plusVertical.setAttribute('stroke', 'currentColor');
        plusVertical.setAttribute('stroke-width', '2');
        
        const plusHorizontal = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        plusHorizontal.setAttribute('x1', '8');
        plusHorizontal.setAttribute('y1', '12');
        plusHorizontal.setAttribute('x2', '16');
        plusHorizontal.setAttribute('y2', '12');
        plusHorizontal.setAttribute('stroke', 'currentColor');
        plusHorizontal.setAttribute('stroke-width', '2');
        
        plusSvg.appendChild(plusCircle);
        plusSvg.appendChild(plusVertical);
        plusSvg.appendChild(plusHorizontal);
        addTagButton.appendChild(plusSvg);
        
        addTagButton.title = 'Add color tag';
        itemElement.insertBefore(addTagButton, itemElement.firstChild);

        const itemPalette = this.createItemPalette(itemElement);
        itemElement.appendChild(itemPalette);

        const eventHandler = (e) => {
            e.stopPropagation(); 
            e.preventDefault(); 
            this.toggleItemPalette(itemElement, itemPalette);
        };

        // Add click and touch events
        addTagButton.addEventListener('click', eventHandler);
        addTagButton.addEventListener('touchstart', eventHandler, { passive: false });
        
        // Add keyboard event for Enter and Space keys
        addTagButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                this.toggleItemPalette(itemElement, itemPalette);
            }
        });

        // Add global escape key handler to close palette
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.activePalette && this.activePalette.paletteEl === itemPalette) {
                e.preventDefault();
                this.toggleItemPalette(itemElement, itemPalette, false);
                addTagButton.focus(); // Return focus to the button
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Store the escape handler for potential cleanup
        itemElement._escapeHandler = escapeHandler;

        const existingTags = itemElement.querySelectorAll(`.${this.itemTagsClass} > .applied-tag`);
        existingTags.forEach(tagDiv => {
            this.addTagRemovalListeners(tagDiv);
        });
    }

    createItemPalette(itemElement) {
        const palette = document.createElement('div');
        palette.classList.add('item-color-palette');
        palette.setAttribute('role', 'menu');
        palette.setAttribute('aria-label', 'Color tag options');

        this.colors.forEach((colorObj, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.classList.add('color-tag-option');
            colorDiv.style.backgroundColor = colorObj.color;
            colorDiv.dataset.color = colorObj.color;
            colorDiv.dataset.colorName = colorObj.name;
            colorDiv.title = `Tag with ${colorObj.name}`;
            
            // Make keyboard accessible
            colorDiv.setAttribute('tabindex', '0');
            colorDiv.setAttribute('role', 'menuitem');
            colorDiv.setAttribute('aria-label', `Tag with ${colorObj.name} color`);

            const eventHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addTagToItem(itemElement, colorObj);
                this.toggleItemPalette(itemElement, palette, false); // Hide palette after selection
                
                // Return focus to the add button
                const addButton = itemElement.querySelector('.item-add-tag-button');
                if (addButton) {
                    addButton.focus();
                }
            };

            // Mouse and touch events
            colorDiv.addEventListener('click', eventHandler);
            colorDiv.addEventListener('touchstart', eventHandler, { passive: false });
            
            // Keyboard events
            colorDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    eventHandler(e);
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % this.colors.length;
                    const nextOption = palette.children[nextIndex];
                    if (nextOption) {
                        nextOption.focus();
                    }
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + this.colors.length) % this.colors.length;
                    const prevOption = palette.children[prevIndex];
                    if (prevOption) {
                        prevOption.focus();
                    }
                }
            });
            
            palette.appendChild(colorDiv);
        });
        return palette;
    }

    toggleItemPalette(itemElement, paletteToToggle, forceState) {
        const buttonToToggle = itemElement.querySelector('.item-add-tag-button');
        const isCurrentlyActive = paletteToToggle.classList.contains('active');
        const shouldBeActive = (forceState === undefined) ? !isCurrentlyActive : forceState;

        // If we are trying to make this palette active (shouldBeActive is true)
        if (shouldBeActive) {
            // And if there's another palette currently active (this.activePalette exists and is not the one we are trying to open)
            if (this.activePalette && this.activePalette.paletteEl !== paletteToToggle) {
                if (this.activePalette.paletteEl) {
                    this.activePalette.paletteEl.classList.remove('active');
                }
                if (this.activePalette.triggerEl) {
                    this.activePalette.triggerEl.classList.remove('palette-active');
                    this.activePalette.triggerEl.setAttribute('aria-expanded', 'false');
                }
                // Important: this.activePalette will be updated below, so we don't nullify it here yet
                // unless we explicitly only want one open ever, which is the case.
            }

            // Now, activate the target palette
            paletteToToggle.classList.add('active');
            if (buttonToToggle) {
                buttonToToggle.classList.add('palette-active');
                buttonToToggle.setAttribute('aria-expanded', 'true');
            }
            this.activePalette = { 
                paletteEl: paletteToToggle, 
                triggerEl: buttonToToggle, 
                itemEl: itemElement 
            };
            
            // Focus the first color option when palette opens
            const firstColorOption = paletteToToggle.querySelector('.color-tag-option');
            if (firstColorOption) {
                firstColorOption.focus();
            }
        } else { // If we are trying to make this palette inactive (shouldBeActive is false)
            paletteToToggle.classList.remove('active');
            if (buttonToToggle) {
                buttonToToggle.classList.remove('palette-active');
                buttonToToggle.setAttribute('aria-expanded', 'false');
            }
            // If this was the active palette, clear the record
            if (this.activePalette && this.activePalette.paletteEl === paletteToToggle) {
                this.activePalette = null;
            }
        }
    }

    /**
     * Add a tag to an item
     * @param {HTMLElement} itemElement - The element to add the tag to
     * @param {Object} colorObj - The color object with name and color properties
     * @param {boolean} [triggerEvent=true] - Whether to trigger the tagAdded event
     * @returns {HTMLElement|null} - The created tag element or null if tag couldn't be added
     */
    addTagToItem(itemElement, colorObj, triggerEvent = true) {
        const tagsContainer = itemElement.querySelector(`.${this.itemTagsClass}`);
        if (!tagsContainer) {
            console.error('Item tags container not found.', itemElement);
            return null;
        }

        // Prevent adding duplicate color tags
        const existingTag = tagsContainer.querySelector(`.applied-tag[data-color="${colorObj.color}"]`);
        if (existingTag) {
            return null; // Already tagged with this color
        }

        const tagDiv = document.createElement('div');
        tagDiv.classList.add('applied-tag');
        tagDiv.style.backgroundColor = colorObj.color;
        tagDiv.dataset.color = colorObj.color;
        tagDiv.dataset.colorName = colorObj.name;

        this.addTagRemovalListeners(tagDiv);
        tagsContainer.appendChild(tagDiv);
        
        // Only trigger event if requested (default is true)
        if (triggerEvent) {
            // Get the item's ID or generate a unique identifier
            const itemId = itemElement.id || this._generateItemId(itemElement);
            
            // Dispatch custom event
            this._dispatchEvent('tagAdded', {
                itemElement: itemElement,
                itemId: itemId,
                tagElement: tagDiv,
                color: colorObj.color,
                colorName: colorObj.name,
                timestamp: new Date()
            });
        }
        
        return tagDiv;
    }

    addTagRemovalListeners(tagDiv) {
        // Add accessibility attributes
        tagDiv.setAttribute('role', 'button');
        tagDiv.setAttribute('tabindex', '0');
        tagDiv.setAttribute('aria-label', `Remove ${tagDiv.dataset.colorName || 'color'} tag`);
        
        // Touch to remove
        tagDiv.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Important to prevent other actions
            e.stopPropagation();
            this.removeTag(tagDiv);
        }, { passive: false });
        
        // Keyboard to remove (Enter or Space or Delete)
        tagDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                this.removeTag(tagDiv);
            }
        });

        // Mouse hover to show 'X'
        let removeMark = null;
        tagDiv.addEventListener('mouseenter', () => {
            if (removeMark || 'ontouchstart' in window) return; // Already showing or on a touch device where this is not the primary removal method
            
            removeMark = document.createElement('span');
            removeMark.classList.add('remove-tag-mark');
            
            // Create SVG for X icon
            const xSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            xSvg.setAttribute('viewBox', '0 0 24 24');
            xSvg.setAttribute('width', '10');
            xSvg.setAttribute('height', '10');
            xSvg.setAttribute('aria-hidden', 'true'); // Hide from screen readers
            xSvg.classList.add('x-icon');
            
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '6');
            line1.setAttribute('y1', '6');
            line1.setAttribute('x2', '18');
            line1.setAttribute('y2', '18');
            line1.setAttribute('stroke', 'white');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('stroke-linecap', 'round');
            
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '18');
            line2.setAttribute('y1', '6');
            line2.setAttribute('x2', '6');
            line2.setAttribute('y2', '18');
            line2.setAttribute('stroke', 'white');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('stroke-linecap', 'round');
            
            xSvg.appendChild(line1);
            xSvg.appendChild(line2);
            removeMark.appendChild(xSvg);
            
            removeMark.title = 'Remove tag';
            
            removeMark.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent tag click if X is clicked
                e.preventDefault();
                this.removeTag(tagDiv);
            });
            // Ensure the X mark is only added if the tag is still in the DOM
            if (tagDiv.isConnected) {
                tagDiv.appendChild(removeMark);
            }
        });

        tagDiv.addEventListener('mouseleave', () => {
            if (removeMark) {
                removeMark.remove();
                removeMark = null;
            }
        });
    }

    removeTag(tagDiv) {
        if (tagDiv && tagDiv.parentElement) {
            const color = tagDiv.dataset.color;
            const colorName = tagDiv.dataset.colorName;
            
            // Find the item element (parent of the tags container)
            const itemElement = tagDiv.closest(`.${this.taggableItemClass}`);
            
            // Get the item's ID or generate a unique identifier
            const itemId = itemElement ? (itemElement.id || this._generateItemId(itemElement)) : null;
            
            // Remove the tag element from DOM
            tagDiv.remove();
            
            // Dispatch custom event if we found the parent item
            if (itemElement) {
                this._dispatchEvent('tagRemoved', {
                    itemElement: itemElement,
                    itemId: itemId,
                    color: color,
                    colorName: colorName || this._generateColorName(color), // Fallback if data-color-name is not set
                    timestamp: new Date()
                });
            }
        }
    }
    
    // Helper to generate a unique ID for items without an ID
    _generateItemId(element) {
        if (!element._colorTagId) {
            element._colorTagId = 'item_' + Math.random().toString(36).substr(2, 9);
        }
        return element._colorTagId;
    }
} 