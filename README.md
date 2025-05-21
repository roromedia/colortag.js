# colortag.js

colortag.js is a lightweight JavaScript library for adding color-coded tagging functionality to HTML elements. It provides an intuitive, touch-friendly interface for applying and removing color tags, inspired by macOS Finder's tagging system.

## Features

- 🎨 Color-coded tags with customizable palette
- 📱 Touch-friendly interface with desktop hover effects
- 🔄 Simple API with event hooks for integration
- 🏷️ Support for initial tags via data attributes
- 🎯 Flexible element targeting with CSS selectors
- 📊 Automatic tag container creation
- 🔎 Named colors for better semantics
- 💻 Clean, modern SVG-based UI
- 📝 No dependencies, lightweight codebase
- 🔄 Change colors at initialization time

## Installation

### Manual Download

1. Download the repository files
2. Include the CSS and JS files in your project:

```html
<link rel="stylesheet" href="css/style.css">
<script src="js/colortag.js"></script>
```

## Basic Usage

1. Add HTML elements with the class `taggable-item` containing a div with class `item-tags`:

```html
<div class="taggable-item" id="my-item">
    <p>My taggable content</p>
    <div class="item-tags"></div>
</div>
```

2. Initialize the ColorTag library:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const colorTag = new ColorTag();
    colorTag.init();
});
```

## Advanced Usage

### Customize Colors

You can provide custom colors in two ways:

#### 1. In the constructor

```javascript
const colorTag = new ColorTag({
    colors: [
        { name: 'Ruby', color: '#FF0000' },
        { name: 'Emerald', color: '#00FF00' },
        { name: 'Sapphire', color: '#0000FF' },
        { name: 'Gold', color: '#FFFF00' }
    ]
});
```

You can also provide just hex values, and names will be generated automatically:

```javascript
const colorTag = new ColorTag({
    colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']
});
```

#### 2. In the init() method

You can pass colors directly to the `init()` method as a second parameter:

```javascript
const colorTag = new ColorTag();
colorTag.init('.document-items', [
    { name: 'Important', color: '#FF0000' },
    { name: 'Review', color: '#FFFF00' },
    { name: 'Approved', color: '#00FF00' }
]);
```

Or you can pass an options object to `init()`:

```javascript
const colorTag = new ColorTag();
colorTag.init({
    selector: '.document-items',
    colors: ['#FF0000', '#00FF00', '#0000FF']
});
```

This approach is useful when:
- You need different color sets for different groups of elements
- Colors need to be loaded dynamically from a server
- You want to change colors based on user preferences

### Customize Class Names

You can customize the CSS class names used by the library:

```javascript
const colorTag = new ColorTag({
    taggableItemClass: 'my-taggable-item',
    itemTagsClass: 'my-item-tags'
});
```

### Initialize with CSS Selectors

You can initialize only specific elements by providing a CSS selector to the `init()` method:

```javascript
// Initialize by class
colorTag.init('.content-items .document');

// Initialize by ID
colorTag.init('#specific-document');

// Initialize with complex selector
colorTag.init('.dashboard article[data-type="file"]');
```

When initializing with a selector, ColorTag will:
1. Add the `taggableItemClass` to the elements if they don't have it
2. Create a tag container if one doesn't exist
3. Setup all the necessary event listeners

### Initial Tags via Data Attributes

You can specify initial tags using the `data-initial-tags` attribute:

```html
<!-- Using color names -->
<div class="taggable-item" data-initial-tags="Red, Blue, Green">
    <p>Item with predefined tags</p>
    <div class="item-tags"></div>
</div>

<!-- Using hex values -->
<div class="taggable-item" data-initial-tags="#ec8383, #84cdef">
    <p>Item with hex-defined tags</p>
    <div class="item-tags"></div>
</div>

<!-- Mixed approach -->
<div class="taggable-item" data-initial-tags="Yellow, #ca99de">
    <p>Item with mixed tag definitions</p>
    <div class="item-tags"></div>
</div>
```

Initial tags are applied during initialization and don't trigger events.

### Event Handling

ColorTag provides event hooks for tag operations:

```javascript
// Subscribe to tag added event
colorTag.on('tagAdded', (data) => {
    console.log(`Tag added: ${data.colorName} (${data.color}) to ${data.itemId}`);
    // Save to database, update UI, etc.
});

// Subscribe to tag removed event
colorTag.on('tagRemoved', (data) => {
    console.log(`Tag removed: ${data.colorName} from ${data.itemId}`);
    // Update database, refresh UI, etc.
});

// Unsubscribe from events
const myHandler = (data) => { /* ... */ };
colorTag.on('tagAdded', myHandler);
colorTag.off('tagAdded', myHandler);
```

#### Event Data

The event callbacks receive a data object with the following properties:

**tagAdded Event:**
- `itemElement`: Reference to the DOM element
- `itemId`: ID of the element (or generated unique ID)
- `tagElement`: Reference to the created tag DOM element
- `color`: Hex value of the color (e.g., "#ec8383")
- `colorName`: Name of the color (e.g., "Red")
- `timestamp`: When the tag was added

**tagRemoved Event:**
- `itemElement`: Reference to the DOM element
- `itemId`: ID of the element (or generated unique ID)
- `color`: Hex value of the color
- `colorName`: Name of the color
- `timestamp`: When the tag was removed

## Project Structure

```
colortag.js/
├── css/
│   └── style.css         # Styles for the color tags and UI
├── js/
│   └── colortag.js       # Main library code
├── index.html            # Example/demo page
├── README.md             # This documentation
├── LICENSE               # MIT license
├── .gitignore            # Git ignore file
└── CONTRIBUTING.md       # Contribution guidelines
```

## API Reference

### Constructor Options

The `ColorTag` constructor accepts an options object:

```javascript
const colorTag = new ColorTag({
    // All options are optional
    colors: [...],               // Array of colors (objects or strings)
    taggableItemClass: '...',    // CSS class for taggable items
    itemTagsClass: '...'         // CSS class for tag containers
});
```

### Methods

#### `init(selectorOrOptions = null, colors = null)`

Initializes ColorTag on matching elements.

- **Parameters:**
  - `selectorOrOptions` (optional): Either a CSS selector string or an options object:
    ```javascript
    {
      selector: '.my-selector', // CSS selector
      colors: ['#FF0000', ...] // Array of colors
    }
    ```
  - `colors` (optional): Array of colors to use for this initialization
- **Returns:** Number of initialized elements
- **Examples:**
  ```javascript
  // With selector only
  const count = colorTag.init('.documents .file');
  
  // With colors array as second parameter
  colorTag.init('.documents', ['#FF0000', '#00FF00']);
  
  // With options object
  colorTag.init({
    selector: '.documents',
    colors: [
      { name: 'Critical', color: '#FF0000' },
      { name: 'Normal', color: '#00FF00' }
    ]
  });
  ```

#### `on(eventName, callback)`

Subscribes to an event.

- **Parameters:**
  - `eventName`: 'tagAdded' or 'tagRemoved'
  - `callback`: Function to call when event occurs
- **Returns:** Boolean indicating success
- **Example:**
  ```javascript
  colorTag.on('tagAdded', (data) => {
    updateDatabase(data.itemId, data.colorName);
  });
  ```

#### `off(eventName, callback)`

Unsubscribes from an event.

- **Parameters:**
  - `eventName`: 'tagAdded' or 'tagRemoved'
  - `callback`: The function to remove
- **Returns:** Boolean indicating success
- **Example:**
  ```javascript
  const handler = (data) => { /* ... */ };
  colorTag.on('tagRemoved', handler);
  // Later:
  colorTag.off('tagRemoved', handler);
  ```

## HTML Structure

ColorTag generates the following structure:

```html
<div class="taggable-item">
    <!-- Add Tag Button (added by ColorTag) -->
    <button class="item-add-tag-button">
        <svg class="plus-icon">...</svg>
    </button>
    
    <!-- Content (your existing content) -->
    <p>Your content here</p>
    
    <!-- Tag Container (your existing container or added by ColorTag) -->
    <div class="item-tags">
        <!-- Applied Tags (added when tags are applied) -->
        <div class="applied-tag" data-color="#ec8383" data-color-name="Red" style="background-color: #ec8383;"></div>
        <div class="applied-tag" data-color="#84cdef" data-color-name="Blue" style="background-color: #84cdef;"></div>
    </div>
    
    <!-- Color Palette (added by ColorTag, toggled when button is clicked) -->
    <div class="item-color-palette">
        <div class="color-tag-option" data-color="#c8c8c8" data-color-name="Gray"></div>
        <div class="color-tag-option" data-color="#ec8383" data-color-name="Red"></div>
        <!-- etc. -->
    </div>
</div>
```

## Examples

### Different Color Sets for Different Sections

```javascript
const colorTag = new ColorTag();

// Initialize documents with document-specific colors
colorTag.init('.documents', [
    { name: 'Draft', color: '#AAAAAA' },
    { name: 'Review', color: '#FFCC00' },
    { name: 'Approved', color: '#66CC33' },
    { name: 'Rejected', color: '#CC3333' }
]);

// Initialize tasks with priority colors
colorTag.init('.tasks', [
    { name: 'Low', color: '#33CC33' },
    { name: 'Medium', color: '#FFCC00' },
    { name: 'High', color: '#FF9900' },
    { name: 'Critical', color: '#CC3333' }
]);
```

### Dynamic Colors from Server

```javascript
// Fetch color configuration from server
fetch('/api/user-colors')
    .then(response => response.json())
    .then(colorData => {
        const colorTag = new ColorTag();
        
        // Apply the user's custom colors
        colorTag.init('.user-content', colorData.colors);
    });
```

## Browser Compatibility

ColorTag is compatible with modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers with touch support

## Touch & Mouse Interactions

- **Desktop/Mouse:**
  - Click the "+" button to show color palette
  - Click a color to add a tag
  - Hover over a tag to see the "X" remove button
  - Click the "X" to remove a tag

- **Mobile/Touch:**
  - Tap the "+" button to show color palette
  - Tap a color to add a tag
  - Tap directly on a tag to remove it

## Customization

### CSS Variables (Coming Soon)

Future versions will include CSS variables for easier styling.

### Custom Styling

You can override the CSS classes in `css/style.css` to customize appearance.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 