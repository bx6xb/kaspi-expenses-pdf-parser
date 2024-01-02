const fs = require("fs")
const pdf = require("pdf-parse")

type expensesDataBaseType = {
  date: string
  operation: string
  expense: number
  store: string
}[]

class KaspiPDFParser {
  public static parse = async (path: string): Promise<expensesDataBaseType> => {
    return await pdf(fs.readFileSync(path))
      .then((data) => {
        const jsData = data.text
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

        try {
          if (!fs.existsSync("dist")) {
            fs.mkdirSync("dist")
          }
          const filename = path.split("/").pop()
          fs.writeFileSync(
            `dist/${filename}`.replace(".pdf", ".json"),
            JSON.stringify(jsData)
          )
          console.log("File written successfully")
        } catch (err) {
          console.error("Error writing the file:", err)
        }
      })
      .catch((err) => console.error(err))
  }
}

module.exports = KaspiPDFParser
