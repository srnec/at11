import cheerio from "cheerio";

import { IMenuItem } from "../IMenuItem";
import { IParser } from "../IParser";
import { getDateRegex } from "../parserUtil";

export class Lokalka implements IParser {
    public parse(html: string, date: Date): Promise<IMenuItem[]> {
        const $ = cheerio.load(html);
        let dayMenu = new Array<IMenuItem>();
        const todayRegex = getDateRegex(date);

        const elements = $("li.fdm-item", "div.entry-content.post-content");
        elements.each(function() {
        const node = $(this);
        const title = node.find("p.fdm-item-title").text();
        if (todayRegex.test(title)) {
            parseDailyMenu(node.find("table"));
            return false;
        }
        });

        return Promise.resolve(dayMenu);

        function parseDailyMenu(table: Cheerio) {
            const rows = table.find("tr");
            rows.each((index: number, elem: CheerioElement) => {
                if (index === 0) {
                    return;
                }
                if (index === 1) {
                    dayMenu = dayMenu.concat(parseSoup(elem));
                } else {
                    dayMenu.push(parseOther(elem));
                }
            });
        }

        function parseSoup(row: CheerioElement): IMenuItem[] {
            const cells = $(row).find("td");
            const price = parseFloat(cells.eq(4).text().replace(",", "."));
            const text = cells.eq(2).text() ;
            const soups = text.split("/");

            return soups.map((item) => ({ isSoup: true, text: item.trim(), price }));
        }

        function parseOther(row: CheerioElement): IMenuItem {
            const cells = $(row).find("td");
            return { isSoup: false, text: cells.eq(1).text(), price: parseFloat(cells.eq(4).text().replace(",", ".")) };
        }
    }
 }
