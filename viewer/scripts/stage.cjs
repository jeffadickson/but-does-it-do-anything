const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
fs.mkdirSync(path.join(root,'books'), {recursive:true});
fs.copyFileSync(path.join(root,'..','lessons','mathematics','algebra-adventure','app','Algebra_Adventure.html'),path.join(root,'books','Algebra_Adventure.html'));
