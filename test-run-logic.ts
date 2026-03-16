import { getProjectById } from './src/services/sanity/news.ts';
(async () => {
    try {
        const project = await getProjectById('herodaki-full-screenviewer-tiklayinca-alttaki-icerik-bloklarindaki-gorseller-fullscreen-viewer');
        console.log(JSON.stringify(project?.contentBlocks, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
