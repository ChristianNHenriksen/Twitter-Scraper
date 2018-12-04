import * as agent from "superagent";
import cheerio = require('cheerio');

export interface Website {
    html: string;
    images: string[];
}

export class WebScraper {
    async getWebsite(url: string): Promise<Website> {
        return await agent.get(url).then(response => {
            const html = response.text;
            var $ = cheerio.load(html);
            const images = $("img").toArray().map(element => element.attribs["src"])
            return { html, images };
        });
    }
}
