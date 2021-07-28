module.exports = class OrderCapital {
    

    static calculateAmount(side, size, price) {
        //amount = cost / price
        if (size && size === 0) throw new Error(`Invalid calculate amount size: ${size}`);
        if (price && price === 0) throw new Error(`Invalid calculate amount price: ${price}`);

        return size / price;

        // if (side === 'long') {
        //     return amount;
        // } else if  (side === 'short') {
        //     return amount * (-1);
        // } else {
        //     throw new Error(`Invalid amount side: ${side}`);
        // }

        // const capital = new OrderCapital();

        // capital.type = OrderCapital.ASSET;
        // capital.asset = asset;
        // return capital;
    }

    static calculateCost() {
        //cost = amount * price
    }

    static calculatePrice() {
        //price = amount / cost
    }

};