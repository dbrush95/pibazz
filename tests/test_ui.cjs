// Template/state regressions. This is not a browser or visual layout test.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const desk = {innerHTML:'', classList:{toggle:()=>{}}, querySelector:()=>null, querySelectorAll:()=>[]};
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

assert.equal(run('deadzone(0.1)'),0);
assert.equal(run('deadzone(-0.1)'),0);
assert.equal(run('deadzone(1)'),1);
assert.equal(run('deadzone(-1)'),-1);
assert.match(run('playBody(false)'), /data-compatibility/);
assert.match(run('playBody(false)'), /data-panel="picture"/);
run('state.section="Pi"; state.pi={hostname:"pi",country:"US",timezone:"UTC",ssh:false,sinks:[],audio:"",errors:[]};');
assert.match(run('settingsBody()'), /Open full raspi-config/);
assert.match(run('settingsBody()'), /No outputs found/);
console.log('Controller deadzone, compatibility action, and Pi settings templates passed.');
// Exercise keyboard editing against a small input stub, including PIN constraints.
context.Event = class {constructor(type){this.type=type}};
const field = {value:'123',selectionStart:3,selectionEnd:3,maxLength:4,inputMode:'numeric',
  matches:(s)=>s==='input, textarea',dispatchEvent:()=>{}};
context.document.contains=()=>true;
context.testField=field;
run('state.oskTarget=testField; state.oskShift=false; typeInto("4")');
assert.equal(field.value,'1234');
run('typeInto("5"); typeInto("a")');
assert.equal(field.value,'1234');
run('typeInto("back")');
assert.equal(field.value,'123');
console.log('On-screen PIN typing, maxlength, numeric filtering and backspace passed.');
