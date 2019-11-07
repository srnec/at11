import cheerio from "cheerio";
import { Moment } from "moment-timezone";

import { IMenuItem } from "./IMenuItem";
import { IParser } from "./IParser";
import "./parserUtil";
import { parsePrice } from "./parserUtil";

export class Giuliano implements IParser {
    public parse(html: string, date: Moment, doneCallback: (menu: IMenuItem[]) => void): void {
        const $ = cheerio.load(html);
        let dayMenu = new Array<IMenuItem>();
        const dateRegex = new RegExp(`0?${date.date()}\\.\\s?0?${date.month() + 1}\\.\\s?${date.year()}`);

        $("table#denne-menu tr").each((i, elem) => {
            const $this = $(elem);
            const dateCellText = $this.children("td").first().text();

            if (dateRegex.test(dateCellText)) {
                const foodCell = $this.children("td").eq(1);
                dayMenu = this.parseMeals(foodCell);

                const priceCell = $this.children("td").eq(2);
                const prices = this.parsePrices(priceCell);

                for (let x = 1; x < dayMenu.length; x++) {
                    dayMenu[x].price = prices[x - 1] || NaN;
                }

                return false;
            }
        });

        doneCallback(dayMenu);
    }

    private parseMeals(cell: Cheerio): IMenuItem[] {
        const items = new Array<IMenuItem>();
        cell.text().split("\n").map(str => str.trim()).filter(str => str.length > 0).forEach((str, i) => {
            if (i === 0 ) {
                items.push({isSoup: true, price: NaN, text: this.normalize(str)});
                return;
            }
            if (str === "Špeciálna ponuka:") {
                return;
            }
            items.push({isSoup: false, price: NaN, text: this.normalize(str)});
        });
        return items;
    }

    private parsePrices(cell: Cheerio): number[] {
        const items = new Array<number>();
        cell.text().split("\n").map(str => str.trim()).filter(str => str.length > 0).forEach((str, i) => {
            if (str === "Špeciálna ponuka:") {
                return;
            }
            items.push(parsePrice(str).price);
        });
        return items;
    }

    private normalize(str: string) {
        return str.normalizeWhitespace()
            .removeItemNumbering()
            .removeMetrics()
            .correctCommaSpacing();
    }
}
