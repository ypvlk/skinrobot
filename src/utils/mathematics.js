const _ = require('lodash');

module.exports = class Mathematics {
    constructor() {

    }

    static medianFromArray(array) {
        if (!Array.isArray(array) || !array.length) {
            return undefined;
        }

        const sortedArr = array.sort((a, b) => (a - b));
        
        if ((sortedArr.length % 2) === 1) {
            return sortedArr[Math.floor(sortedArr.length / 2)];
        } else {
            return (0.5 * (sortedArr[sortedArr.length / 2 - 1] + sortedArr[sortedArr.length / 2]));
        }
    }

    static changesFromClose(array) {
        if (!Array.isArray(array) || !array.length) {
            return undefined;
        }

        const changes = [];

        for (let i = 0; i < array.length; i++) {
            if (array[i + 1]) {
                // Math.floor(num * 100) / 100;
                const change = Math.trunc((((array[i].close - array[i+1].close) / array[i].close) * 100) * 100) / 100;
                changes.push(change);
            }
        }
        
        return changes;
    }

    static beta(arrayOfarrays) {
        if (!Array.isArray(arrayOfarrays) || !arrayOfarrays.length || arrayOfarrays.length > 2) {
            return undefined;
        }

        if (!Array.isArray(arrayOfarrays[0]) || !arrayOfarrays[0].length || !Array.isArray(arrayOfarrays[1]) || !arrayOfarrays[1].length) {
            return undefined;
        }
        
        let betasArrayOfArray = [];
        let firstPairArray = arrayOfarrays[0];
        let secondPairArray = arrayOfarrays[1];

        if (firstPairArray.length !== secondPairArray.length) {
            //Нужно обрезать больший массив
            if (firstPairArray.length > secondPairArray.length){
                firstPairArray = firstPairArray.slice(0, secondPairArray.length);
            } else {
                secondPairArray = secondPairArray.slice(0, firstPairArray.length);
            }
        }
        
        let straightBetas = [];
        let inverseBetas = [];

        for (let i = 0; i < firstPairArray.length; i++) {
            straightBetas.push(Math.trunc((firstPairArray[i] / secondPairArray[i]) * 100) / 100); 
            inverseBetas.push(Math.trunc((secondPairArray[i] / firstPairArray[i]) * 100) / 100); 
        }

        betasArrayOfArray.push(straightBetas);
        betasArrayOfArray.push(inverseBetas);

        return betasArrayOfArray;
    }

    static moda(array) {
        if (!Array.isArray(array) || !array.length) {
            return undefined;
        }

        
    }

};
