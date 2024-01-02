const fs = require("fs")
const pdf = require("pdf-parse")

type ExpensesDataBaseType = {
  date: string
  operation: string
  expense: number
  store: string
}[]

class KaspiPDFParser {
  public static parse = async (...paths: string[]) => {
    let expensesDataBase: ExpensesDataBaseType = []
    for (const path of paths) {
      const data = await this.Parser(path)
      expensesDataBase = [...expensesDataBase, ...data]
    }
    fs.writeFileSync("dist/expenses.json", JSON.stringify(expensesDataBase))
  }

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
