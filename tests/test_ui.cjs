// Template/state regressions. This is not a browser or visual layout test.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const desk = {innerHTML:'', querySelector:()=>null, querySelectorAll:()=>[]};
const context = vm.createContext({
  document:{getElementById:()=>desk,querySelector:()=>null,querySelectorAll:()=>[],hasFocus:()=>true},
  localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  fetch:()=>new Promise(()=>{}), setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,
  requestAnimationFrame:()=>{}, navigator:{}, console,
});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../shelf/shelf.js'),'utf8'),context);
function run(code){return vm.runInContext(code,context)}
run('state.authReady=true; state.notice="Bad code"; draw()');
assert.match(desk.innerHTML,/role="alert">Bad code/);
run('state.profile={name:"<Kid>",pin:""}; state.unlocked=true; state.open=["play"]; state.focus="play"; draw()');
assert.match(desk.innerHTML,/Hi, &lt;Kid&gt;/);
assert.match(desk.innerHTML,/data-diagnose/);
assert.match(desk.innerHTML,/value="auto" selected/);
assert.equal(run('pairLabel({status:"failed",log:"Bad pairing"},true)'), 'Bad pairing');
run('state.native={status:"failed",label:"Moonlight",log:"<error>"}; draw()');
assert.match(desk.innerHTML,/&lt;error&gt;/);
assert.match(run('browserBody()'), /Super \+ H/);
console.log('UI template/state tests passed (not a visual browser test).');
