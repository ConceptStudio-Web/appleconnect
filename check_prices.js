const fs = require('fs');

try {
  const content = fs.readFileSync('data/products.js', 'utf8');
  // Hack to evaluate the JS object array since it's just `window.PRODUCTS = [...]` or naked array
  let jsCode = content;
  if (!jsCode.trim().startsWith('window.PRODUCTS')) {
    jsCode = `module.exports = ${jsCode};`
  }
  
  // Safe eval by making a temp module
  fs.writeFileSync('tmp_eval.js', jsCode);
  const products = require('./tmp_eval.js');
  
  const iphones = products.filter(p => p.category === 'iphone');
  console.log(`Total iPhones: ${iphones.length}`);
  
  const missingPrices = iphones.filter(p => typeof p.price !== 'number' || isNaN(p.price));
  console.log(`iPhones missing numeric prices: ${missingPrices.length}`);
  
  if (missingPrices.length > 0) {
    missingPrices.forEach(p => console.log(`- ${p.id || p.model} (price type: ${typeof p.price}, value: ${p.price})`));
  } else {
    console.log("All iPhones have numeric prices.");
  }
  
} catch (e) {
  console.error(e);
}
