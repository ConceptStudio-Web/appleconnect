const window = {};
try {
    require('./data/products.js');
    console.log('Products loaded:', window.PRODUCTS.length);
} catch (e) {
    console.error('Error loading products.js:', e.message);
}
