
const seq = num => Array.from(Array(num), (_, i) => i)

const compose = (...fs) => fs.reduceRight((pF, nF) => (...args) => nF(pF(...args)), v => v)

export {
  compose,
  seq,
}
