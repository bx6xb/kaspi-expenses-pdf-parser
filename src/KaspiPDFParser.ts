const fs = require("fs")
const pdf = require("pdf-parse")

// type for expenses data base
type ExpensesDataBaseType = {
  date: string
  operation: string
  expense: number
  store: string
}[]

class KaspiPDFParser {
  // Applies paths to pdf files and writes parsed data in expenses.json file
  public static parse = async (...paths: string[]) => {
    let expensesDataBase: ExpensesDataBaseType = []
    for (const path of paths) {
      const data = await this.Parser(path)
      expensesDataBase = [...expensesDataBase, ...data]
    }
    console.log(expensesDataBase.length)
    expensesDataBase = this.deleteDuplicates(expensesDataBase)
    console.log(expensesDataBase.length)
    fs.writeFileSync("../dist/expenses.json", JSON.stringify(expensesDataBase))
  }

  // Deletes duplicates from expenses data base
  private static deleteDuplicates = (
    arrOfObjects: ExpensesDataBaseType
  ): ExpensesDataBaseType => {
    const stringArr: string[] = arrOfObjects.map((obj) => JSON.stringify(obj))
    const set: Set<string> = new Set(stringArr)
    const arr: ExpensesDataBaseType = [...set].map((obj) => JSON.parse(obj))
    return arr
  }

  // Paarses data from pdf file and returns parsed data
  private static Parser = async (
    path: string
  ): Promise<ExpensesDataBaseType> => {
    return await pdf(fs.readFileSync(path))
      .then((data: any) =>
        data.text
          .replace(/(\-|\+) /g, ` $1`)
          .replace(
            /Перевод|Пополнение|Покупка| ₸|(?<=\d) (?=\d{3})|\(.+?\)/g,
            ""
          )
          .replace(/\s{2,}/g, " ")
          .match(
            /\d{2}\.\d{2}\.\d{2} (\+|\-)\d+,\d{2}\s+.+?(?=\s+\d{2}\.\d{2}\.\d{2})/g
          )
          .map((item: string) => {
            const expensesData = item.split(" ")
            return {
              date: expensesData[0],
              operation: expensesData[1].indexOf("-") + 1 ? "-" : "+",
              expense: +expensesData[1].slice(1).replace(",", "."),
              store: expensesData.slice(2, expensesData.length).join(" "),
            }
          })
      )
      .catch((err: Error) => console.error(err))
  }
}

module.exports = KaspiPDFParser
