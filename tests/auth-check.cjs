// Tests use synthetic local fixtures only; no browser or remote account is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {webcrypto, pbkdf2Sync} = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname,'../public/assets/auth.js'),'utf8');

function setup({secure=true}={}) {
  const elements = new Map(), data = new Map();
  class Element {
    constructor(id){this.id=id;this.value='';this.textContent='';this.hidden=false;this.checked=false;this.disabled=false;this.events={};this.dataset={};this.attrs={};this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
    addEventListener(type,cb){this.events[type]=cb;}
    async fire(type){return this.events[type]?.({preventDefault(){},currentTarget:this});}
    querySelector(){return element(this.id+'.submit');}
    reportValidity(){return true;}
    reset(){}
    setAttribute(k,v){this.attrs[k]=v;}
    getAttribute(k){return this.attrs[k];}
    close(){this.open=false;}
  }
  function element(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);}
  const tabs=['login','signup'].map(name=>{const e=element('tab-'+name);e.dataset.authTab=name;return e;});
  const A={
    read:(key,fallback,kind='localStorage')=>data.has(kind+key)?JSON.parse(data.get(kind+key)):fallback,
    write:(key,val,kind='localStorage')=>{data.set(kind+key,JSON.stringify(val));return true;},
    remove:(key,kind='localStorage')=>{data.delete(kind+key);return true;},
    getProfiles:()=>A.read('jsp.profiles.v1',[]),
    getSession:()=>{const s=A.read('jsp.session.v1',null,'sessionStorage')||A.read('jsp.session.v1',null);return s&&s.expires>Date.now()?A.getProfiles().find(p=>p.email===s.email):null;},
    updateState(){}, toast(){}, showDialog:d=>{d.open=true;}
  };
  const document={querySelector:s=>element(s.slice(1)),querySelectorAll:s=>s==='[data-auth-tab]'?tabs:[],getElementById:element};
  const window={JSP:A,crypto:secure?webcrypto:{getRandomValues:webcrypto.getRandomValues.bind(webcrypto)},addEventListener(){}};
  vm.runInNewContext(source,{window,document,crypto:window.crypto,TextEncoder,Uint8Array,Date});
  function fillSignup({email='fixture@example.com',password='LocalFixture27!',confirm=password,name='Garden Tester'}={}) {
    element('signup-name').value=name; element('signup-email').value=email; element('signup-password').value=password; element('signup-confirm').value=confirm;
  }
  return {A,element,data,fillSignup};
}

test('signup hashes the password, creates a local session, logout and sign-in work',async()=>{
  const t=setup();t.fillSignup();await t.element('signup-form').fire('submit');
  const p=t.A.getProfiles()[0];assert.equal(p.email,'fixture@example.com');assert.equal(p.name,'Garden Tester');
  assert.equal(p.hash,pbkdf2Sync('LocalFixture27!',Buffer.from(p.salt,'hex'),120000,32,'sha256').toString('hex'));
  assert(!JSON.stringify(p).includes('LocalFixture27!'));assert.equal(t.element('account-dashboard').hidden,false);
  await t.element('logout').fire('click');assert.equal(t.A.getSession(),null);assert.equal(t.element('auth-forms').hidden,false);
  t.element('login-email').value='FIXTURE@example.com';t.element('login-password').value='wrong-fixture-password';await t.element('login-form').fire('submit');
  assert.match(t.element('auth-message').textContent,/incorrect/);assert.equal(t.A.getSession(),null);
  t.element('login-password').value='LocalFixture27!';t.element('remember-me').checked=true;await t.element('login-form').fire('submit');
  assert.equal(t.A.getSession().email,p.email);assert(t.data.has('localStoragejsp.session.v1'));assert(!t.data.has('sessionStoragejsp.session.v1'));
});

test('mismatched passwords and duplicate normalized emails are rejected',async()=>{
  const t=setup();t.fillSignup({confirm:'SomethingElse27!'});await t.element('signup-form').fire('submit');assert.equal(t.A.getProfiles().length,0);assert.match(t.element('auth-message').textContent,/do not match/);
  t.fillSignup();await t.element('signup-form').fire('submit');await t.element('logout').fire('click');
  t.fillSignup({email:' FIXTURE@example.com '});await t.element('signup-form').fire('submit');assert.equal(t.A.getProfiles().length,1);assert.match(t.element('auth-message').textContent,/already uses/);
});

test('removing a local profile signs it out without removing the enquiry list',async()=>{
  const t=setup();t.fillSignup();await t.element('signup-form').fire('submit');t.A.write('jsp.enquiry.v1',['0072']);
  t.element('reset-email').value='fixture@example.com';await t.element('reset-form').fire('submit');
  assert.equal(t.A.getProfiles().length,0);assert.equal(t.A.getSession(),null);assert.deepEqual(t.A.read('jsp.enquiry.v1',[]),['0072']);
});

test('unsupported/insecure context reports a useful error without saving a password',async()=>{
  const t=setup({secure:false});t.fillSignup();await t.element('signup-form').fire('submit');
  assert.equal(t.A.getProfiles().length,0);assert.match(t.element('auth-message').textContent,/HTTPS or localhost/);
});

test('damaged credential data is rejected and storage failure is visible',async()=>{
  const t=setup();t.A.write('jsp.profiles.v1',[{email:'fixture@example.com',name:'Test',salt:'bad',hash:'bad',iterations:120000}]);
  t.element('login-email').value='fixture@example.com';t.element('login-password').value='LocalFixture27!';await t.element('login-form').fire('submit');
  assert.match(t.element('auth-message').textContent,/damaged/);assert.equal(t.A.getSession(),null);
  const blocked=setup();blocked.A.write=()=>false;blocked.fillSignup();await blocked.element('signup-form').fire('submit');
  assert.match(blocked.element('auth-message').textContent,/could not be saved/);assert.equal(blocked.A.getProfiles().length,0);
});
