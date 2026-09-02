const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let html = fs.readFileSync(f, 'utf8');
    
    // Replace .jpeg back to .png
    let newHtml = html.replace(/frontend\/assets\/img\/logo\.jpeg/g, 'frontend/assets/img/logo.png');
    
    if (html !== newHtml) {
        fs.writeFileSync(f, newHtml);
        console.log('Updated logo back to .png in', f);
    }
});
