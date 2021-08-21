import { Context } from 'egg';
import * as fs from 'fs';
import moment = require('moment');

module.exports = {
  getToken(ctx: Context): string | undefined {
    const authorization = ctx.request.header?.authorization as string;
    if (authorization) {
      let [_, token] = authorization.split(' ');
      return token;
    }
    return undefined;
  },
  readFile(filePath: string) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (error, buffer) => {
        if (error) {
          reject(error);
        }
        resolve(buffer);
      });
    });
  },
  writeFile(filePath, fileData) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, fileData, error => {
        if (error) {
          reject(error);
        } else {
          resolve(filePath);
        }
      });
    });
  },
  handleBills(
    MonthBills: BillsData.Record[],
    mode: 'MM-DD' | 'YYYY-MM' = 'MM-DD'
  ): BillsData.Bills[] {
    const hashMap: Map<string, BillsData.Record[]> = new Map();
    //按照日期归类
    for (let item of MonthBills) {
      let attr = moment(item.date).format(mode);
      if (hashMap.get(attr)) {
        hashMap.get(attr)!.push(item);
        continue;
      }
      hashMap.set(attr, [item]);
    }

    const bills: BillsData.Bills[] = [];
    hashMap.forEach((value, key) => {
      let temp: BillsData.Bills = { time: '', data: [], income: 0, outlay: 0 };
      //计算 支出和收入
      const total = value.reduce(
        (preTotal, cur) =>
          cur.payType === 1
            ? {
                ...preTotal,
                income: Number(cur.amount) + preTotal.income,
              }
            : { ...preTotal, outlay: Number(cur.amount) + preTotal.outlay },
        { income: 0, outlay: 0 }
      );
      Object.assign(temp, total);
      temp['time'] = key;
      temp['data'] = value;
      bills.push(temp);
    });

    return bills;
  },
  getTotalByTime(monthBills: BillsData.Bills[]): BillsData.TotalGroup {
    return monthBills.reduce(
      (preTotal, cur) => ({
        totalIncome: cur.income + preTotal.totalIncome,
        totalOutlay: cur.outlay + preTotal.totalOutlay,
      }),
      { totalIncome: 0, totalOutlay: 0 }
    );
  },
};
