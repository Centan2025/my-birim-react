const fs = require('fs');
const content = fs.readFileSync('f:/birim-web-antigravity/birim-web/tools/mediaImport/MediaImportTool.tsx', 'utf8');

let braces = 0;
let parens = 0;
let stacks = 0;
let flexes = 0;
let cards = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braces++;
  if (content[i] === '}') braces--;
  if (content[i] === '(') parens++;
  if (content[i] === ')') parens--;
}

console.log('Braces balance:', braces);
console.log('Parens balance:', parens);

const stackMatches = content.match(/<Stack/g) || [];
const stackCloseMatches = content.match(/<\/Stack>/g) || [];
console.log('Stacks:', stackMatches.length, 'vs', stackCloseMatches.length);

const flexMatches = content.match(/<Flex/g) || [];
const flexCloseMatches = content.match(/<\/Flex>/g) || [];
console.log('Flexes:', flexMatches.length, 'vs', flexCloseMatches.length);

const cardMatches = content.match(/<Card/g) || [];
const cardCloseMatches = content.match(/<\/Card>/g) || [];
console.log('Cards:', cardMatches.length, 'vs', cardCloseMatches.length);

const containerMatches = content.match(/<Container/g) || [];
const containerCloseMatches = content.match(/<\/Container>/g) || [];
console.log('Containers:', containerMatches.length, 'vs', containerCloseMatches.length);
