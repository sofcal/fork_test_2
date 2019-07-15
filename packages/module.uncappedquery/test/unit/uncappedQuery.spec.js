// 'use strict';
// var maxCount = 50;
//
// function Query(startIndex, count, where) {
//
//     this.startIndex = parseInt(startIndex, 10);
//     this.count = parseInt(count, 10);
//     this.where = where ? where : {};
//     this.orderBy = undefined;
//     this.groupBy = undefined;
//     this.projection = undefined;
//
//     this.validate();
// }
// var p = Query.prototype;
//
// p.validate = function(){
//
//     if (this.startIndex < 0 || this.startIndex === undefined || isNaN(this.startIndex)){
//         this.startIndex = 0;
//     }
//
//     if (this.count <= 0 || this.count > maxCount || this.count === undefined || isNaN(this.count)){
//         this.count = maxCount;
//     }
// };
//
// const query = new Query;
// const UncappedQuery = require('../../lib/UncappedQuery')(1, 2, { 'someId': '012345678' }, query);
//
// describe('@sage/bc-uncappedquery', function() {
//     it('should export a function which is an instance of Query', (done) => {
//         console.log('>>>>>>>>>>> ' + JSON.stringify(UncappedQuery));
//         console.log('------- ' + JSON.stringify(UncappedQuery.prototype));
//         UncappedQuery.should.be.a.Function();
//         (UncappedQuery.prototype).should.be.an.instanceOf(Query);
//
//         done();
//     });
// });
