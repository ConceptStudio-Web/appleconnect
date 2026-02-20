
const fs = require('fs');
const path = require('path');

const directoryPath = '.';

function removeFooter(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove footer HTML
    const footerRegex = /<footer[\s\S]*?<\/footer>/gi;
    if (footerRegex.test(content)) {
        content = content.replace(footerRegex, '');
        console.log(`Removed footer from ${filePath}`);
    }

    // Remove footer CSS link
    const cssRegex = /<link[^>]*href=["']assets\/css\/footer\.css[^"']*["'][^>]*>/gi;
    if (cssRegex.test(content)) {
        content = content.replace(cssRegex, '');
        console.log(`Removed footer css from ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (file) {
        if (path.extname(file) === '.html') {
            removeFooter(path.join(directoryPath, file));
        }
    });
});
