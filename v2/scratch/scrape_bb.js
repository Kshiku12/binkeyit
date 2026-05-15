const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');

const productsDir = 'c:\\Users\\kshit\\OneDrive\\Desktop\\Blinkit-Clone_Grp27\\v2\\apps\\web\\public\\images\\products';

const items = [
    { name: 'amul-butter-pasteurized.jpg', url: 'https://www.bigbasket.com/pd/120387/amul-pasteurised-butter-100-g-carton/' },
    { name: 'britannia-daily-bake-recipe-white-bread.jpg', url: 'https://www.bigbasket.com/pd/40003013/britannia-daily-bake-recipe-white-bread-400-g/' },
    { name: 'fresh-red-onion.jpg', url: 'https://www.bigbasket.com/pd/10000148/fresho-onion-500-g/' },
    { name: 'fresh-tomato.jpg', url: 'https://www.bigbasket.com/pd/10000200/fresho-tomato-hybrid-1-kg/' },
    { name: 'banana-robusta.jpg', url: 'https://www.bigbasket.com/pd/10000047/fresho-banana-robusta-1-kg/' },
    { name: 'fresh-potato.jpg', url: 'https://www.bigbasket.com/pd/10000159/fresho-potato-1-kg/' },
    { name: 'green-chilli.jpg', url: 'https://www.bigbasket.com/pd/40048455/fresho-green-chilli-medium-long/' }
];

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Stealth-like configurations to bypass basic bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
    });

    for (const item of items) {
        console.log(`Navigating to ${item.url}`);
        try {
            await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Bigbasket product images are usually inside a div with specific classes, or we can just find the largest image
            // We look for images containing '/media/uploads/p/l/' (large size) or '/media/uploads/p/xxl/' (extra large)
            const imgUrl = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                const bbImg = imgs.find(img => img.src.includes('/media/uploads/p/l/') || img.src.includes('/media/uploads/p/xxl/'));
                return bbImg ? bbImg.src : null;
            });

            if (imgUrl) {
                console.log(`Found image URL: ${imgUrl}`);
                const dest = path.join(productsDir, item.name);
                await downloadImage(imgUrl, dest);
                console.log(`Successfully downloaded to ${item.name}`);
            } else {
                console.log(`No product image found for ${item.name}`);
            }
        } catch (e) {
            console.error(`Failed to process ${item.name}: ${e.message}`);
        }
    }

    await browser.close();
    console.log("Finished scraping.");
})();
