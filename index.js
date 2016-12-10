const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const nconf = require('nconf');

nconf.argv({
    "t": {
        alias: 'target',
        describe: 'Target folder where the wallpapers should be added to.',
        demand: true,
        default: path.join(process.env['USERPROFILE'], "Pictures")
    }
});

const MIN_FILE_SIZE_KB = 300;
const TARGET_DIR = nconf.get('t');
const SOURCE_DIR = path.join(process.env['USERPROFILE'], '/AppData/Local/Packages/Microsoft.Windows.ContentDeliveryManager_cw5n1h2txyewy/LocalState/Assets');

if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error("Wallpaper source path can't be read!")
}
if (!fs.existsSync(TARGET_DIR)) {
    throw new Error("Target folder does not exist.")
}

console.log(`Looking for fresh new stuff...-`);

getWallpaper(wallpaper => {
    wallpaper = filterOutExistingWallpaper(wallpaper);
    if(wallpaper.length > 0) {
        console.log(` -> Found ${wallpaper.length} new wallpapers!`);
        copyWallpaper(wallpaper);
    } else {
        console.log(` -> No new wallpapers were found... :(`);
    }
});


function getWallpaper(fn) {
    fs.readdir(SOURCE_DIR, (err, files) => {
        let wallpaper = files.filter(file => getFileSize(file) >= MIN_FILE_SIZE_KB)
            .filter(file => isPortrait(sizeOf(path.join(SOURCE_DIR, file))));

        fn(wallpaper);
    });

    function getFileSize(file) {
        return fs.statSync(path.join(SOURCE_DIR, file)).size / 1024;
    }

    function isPortrait(dimension) {
        return dimension.height < dimension.width;
    }
}

function filterOutExistingWallpaper(wallpaper) {
    return wallpaper.filter(wp => !fs.existsSync(path.join(TARGET_DIR, wp) + '.jpg'))
}

function copyWallpaper(wallpaper) {
    wallpaper.forEach((wp, idx) => {
        const source = path.join(SOURCE_DIR, wp);
        const target = path.join(TARGET_DIR, wp) + '.jpg';
        fs.createReadStream(source).pipe(fs.createWriteStream(target));
        console.log(` -> Copied ${idx + 1}/${wallpaper.lenght} to ${TARGET_DIR}...`)
    });
}
