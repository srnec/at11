var cheerio = require('cheerio');
var parserUtil = require('./parserUtil');

module.exports.parse = function(html, date, callback) {
    var $ = cheerio.load(html);
    var dayMenu = [];

    var menuItems = $("form.productDetail");
	menuItems.each(function(){
		parseItem($(this));
	});

    dayMenu.sort(function(first, second) {
		var f = first.isSoup ? 0 : 1;
		var s = second.isSoup ? 0 : 1;
		return f - s;
    });

    callback(dayMenu);

	function parseItem(item){
		var itemParent = item.parent();
		var name = itemParent.find("h2.MainTitle").text();
		if (name){
			var nameParts = name.split("   ");
			var food = normalize(nameParts[0]);
			var foodPrice = parserUtil.parsePrice(itemParent.find("div.product_price").text()).price;
			var soup = normalize(nameParts[1]);

			dayMenu.push({
				isSoup: false,
				text: food,
				price: foodPrice
			});
			
			if (!dayMenuContainsSoup(soup)) {
				dayMenu.push({
					isSoup: true,
					text: soup,
					price: NaN
				});
			}
		}
	}
	
	function dayMenuContainsSoup(soup){
		return dayMenu.filter(function(e) {return e.text === soup;}).length > 0;
	}
	
	function normalize(str) {
        return str.removeItemNumbering()
			.replace("/", " ")
            .normalizeWhitespace()
            .removeMetrics()
            .correctCommaSpacing();
    }
};
