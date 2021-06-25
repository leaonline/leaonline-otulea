import printJS from 'print-js'
import { getProperty } from '../../utils/object/getProperty'

export const printHTMLElement = (target, onClose) => {
  const cssUrls = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const styleSheet = getProperty(document.styleSheets, i)
    if (styleSheet?.href) {
      cssUrls.push(styleSheet.href)
    }
  }
  printJS({
    printable: target,
    type: 'html',
    css: cssUrls,
    targetStyles: ['*'],
    onPrintDialogClose: onClose
  })
}
