/**
 * @lessjs/hub - Demo Configuration for Snapshot Rendering
 *
 * Centralized configuration for rendering component previews.
 * Shared by all snapshot renderers (Playwright, Lit SSR, etc.)
 */

/** Demo attributes to make component snapshots visible and meaningful.
 *  Many WC libraries default to hidden/closed states (e.g. sl-alert open=false).
 */
export const DEMO_ATTRS: Record<string, Record<string, string>> = {
  // Shoelace - need 'open' to be visible
  'sl-alert': { open: '', variant: 'primary' },
  'sl-dialog': { open: '', label: 'Dialog' },
  'sl-drawer': { open: '', label: 'Drawer' },
  'sl-details': { open: '', summary: 'Details' },
  'sl-dropdown': { open: '' },
  'sl-tooltip': { content: 'Tooltip content', open: '', placement: 'top' },
  // Shoelace - need value/content to show state
  'sl-progress-bar': { value: '50' },
  'sl-progress-ring': { value: '50' },
  'sl-range': { value: '50' },
  'sl-rating': { value: '3' },
  'sl-icon': { name: 'star' },
  'sl-icon-button': { name: 'gear', label: 'Settings' },
  'sl-input': { placeholder: 'Type something...', value: 'Hello' },
  'sl-textarea': { placeholder: 'Type something...', value: 'Hello World' },
  'sl-select': { placeholder: 'Choose an option' },
  'sl-color-picker': { value: '#339af0' },
  'sl-badge': { variant: 'primary' },
  'sl-tag': { variant: 'primary', size: 'medium' },
  'sl-button': { variant: 'primary' },
  'sl-avatar': { image: 'https://placehold.co/40x40/339af0/fff?text=JS' },
  'sl-carousel': { navigation: '', pagination: '', loop: '' },
  'sl-animated-image': { src: 'https://placehold.co/200x150/339af0/fff?text=GIF' },
  'sl-image-comparer': {},
  'sl-skeleton': { effect: 'pulse' },
  'sl-spinner': {},
  'sl-split-panel': {},
  'sl-switch': { checked: '' },
  'sl-checkbox': { checked: '' },
  'sl-radio': { checked: '' },
  'sl-radio-group': { label: 'Select one' },
  'sl-tab-group': {},
  'sl-tab': {},
  'sl-tab-panel': {},
  'sl-table': {},
  'sl-tree': {},
  'sl-tree-item': { expanded: '' },
  'sl-card': {},
  'sl-divider': {},
  'sl-menu': {},
  'sl-menu-item': { checked: '' },
  // LessJS UI
  'less-button': { variant: 'primary' },
  'less-card': { variant: 'elevated' },
  'less-input': { placeholder: 'Type here...' },
  'less-dialog': { open: '', label: 'Dialog' },
  'less-code-block': {},
  'less-hero-ping': {},
  'less-theme-toggle': {},
};

/** Demo slot content so components show meaningful structure in previews */
export const DEMO_SLOTS: Record<string, string> = {
  'sl-card':
    '<div slot="header">Card Header</div><div>This is the card body content.</div><div slot="footer">Card Footer</div>',
  'sl-alert': 'This is an alert message with important information.',
  'sl-dialog': '<div slot="label">Dialog Title</div><div>This is the dialog content.</div>',
  'sl-drawer': '<div slot="label">Drawer Title</div><div>This is the drawer content.</div>',
  'sl-details':
    '<div slot="summary">Click to expand</div><div>Here is the hidden detail content.</div>',
  'sl-dropdown':
    '<sl-button slot="trigger" caret>Dropdown</sl-button><sl-menu><sl-menu-item>Option 1</sl-menu-item><sl-menu-item>Option 2</sl-menu-item></sl-menu>',
  'sl-tooltip': '<sl-button>Hover me</sl-button>',
  'sl-select':
    '<sl-menu-item value="a">Option A</sl-menu-item><sl-menu-item value="b">Option B</sl-menu-item>',
  'sl-button': 'Button',
  'sl-badge': 'Badge',
  'sl-tag': 'Tag',
  'sl-menu': '<sl-menu-item>Item 1</sl-menu-item><sl-menu-item>Item 2</sl-menu-item>',
  'sl-menu-item': 'Menu Item',
  'sl-tab-group':
    '<sl-tab slot="nav" panel="a">Tab A</sl-tab> <sl-tab slot="nav" panel="b">Tab B</sl-tab><sl-tab-panel name="a">Panel A</sl-tab-panel> <sl-tab-panel name="b">Panel B</sl-tab-panel>',
  'sl-tree': '<sl-tree-item expanded>Branch<sl-tree-item>Leaf</sl-tree-item></sl-tree-item>',
  'sl-tree-item': 'Tree Item',
  // LessJS UI
  'less-button': 'Click Me',
  'less-card':
    '<div slot="header">Card Title</div><div>This is a card with some body content to demonstrate the layout and styling of the less-card component.</div><div slot="footer">Card Footer</div>',
  'less-input': '',
  'less-dialog': '<div>Dialog body content</div>',
  'less-code-block': '<code>console.log("Hello LessJS!")</code>',
};
