export default class JSZip {
  file() {
    return this
  }
  folder() {
    return this
  }
  generateAsync() {
    return Promise.resolve(new Blob())
  }
}
