const fs = require("fs")
const pdf = require("pdf-parse")

// Type for expenses data base
type ExpensesDatabaseType = {
  date: string
  operation: string
  expense: number
  store: string
}[]

class KaspiPDFParser {
  // Applies paths to pdf files and writes parsed data in expenses.json file
  public static parse = async (...paths: string[]) => {
    // Creating array to store data from pdf files
    let expensesDatabase: ExpensesDatabaseType = []

    // Parsing data from all pdf files
    for (const path of paths) {
      const data = await this.Parser(path)
      expensesDatabase = [...expensesDatabase, ...data]
    }

    // Deleting duplicates
    expensesDatabase = this.deleteDuplicates(expensesDatabase)

    // Writing data in json file
    fs.writeFileSync("../dist/expenses.json", JSON.stringify(expensesDatabase))
  }

  // Delets duplicates from expenses data base
  private static deleteDuplicates = (arrOfObjects: ExpensesDatabaseType): ExpensesDatabaseType => {
    // Converting objects to strings
    const stringArray: string[] = arrOfObjects.map((obj) => JSON.stringify(obj))

    // Deleting duplicates
    const withoutDuplicates: Set<string> = new Set(stringArray)

    // Converting string back to JS objects
    const expensesData: ExpensesDatabaseType = [...withoutDuplicates].map((obj) => JSON.parse(obj))
    return expensesData
  }

  // Parses data from pdf file and returns parsed data
  private static Parser = async (path: string): Promise<ExpensesDatabaseType> =>
    await pdf(fs.readFileSync(path))
      .then((data: any) =>
        data.text
          .replace(/(\-|\+) /g, ` $1`)
          .replace(/Перевод|Пополнение|Покупка| ₸|(?<=\d) (?=\d{3})|\(.+?\)/g, "")
          .replace(/\s{2,}/g, " ")
          .match(/\d{2}\.\d{2}\.\d{2} (\+|\-)\d+,\d{2}\s+.+?(?=\s+\d{2}\.\d{2}\.\d{2})/g)
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

module.exports = KaspiPDFParser
