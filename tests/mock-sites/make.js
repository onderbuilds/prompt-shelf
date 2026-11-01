const banner = (name) => `<header class="hdr">MOCK of ${name} composer — local test page, not the real site</header>`;
const css = `<style>
 body{margin:0;font:15px system-ui,sans-serif;background:#f7f7f8;color:#111;height:100vh;display:flex;flex-direction:column}
 .hdr{background:#fde68a;padding:6px 12px;font-size:12px}
 .conv{flex:1;padding:24px;color:#666}
 .composer{margin:0 auto 28px;width:min(720px,90%);background:#fff;border:1px solid #ddd;border-radius:22px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
 .composer textarea,.composer .ProseMirror,.composer .ql-editor{width:100%;min-height:48px;max-height:220px;overflow:auto;border:0;outline:0;resize:none;font:inherit;white-space:pre-wrap;box-sizing:border-box}
 .composer .ProseMirror p,.composer .ql-editor p{margin:0}
 .row{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12px;color:#888}
 button.send{border:0;border-radius:16px;padding:6px 14px;background:#111;color:#fff}
 button.send:disabled{background:#ccc}
</style>`;
const state = `<div class="row"><span id="state">registered: 0 chars</span><button class="send" id="send" disabled>Send</button></div>
<script>window.__onChange=()=>{const v=(window.__registered&&window.__registered())||'';document.getElementById('state').textContent='registered: '+v.length+' chars';document.getElementById('send').disabled=!v.trim();};</script>`;

const reactTextarea = (attrs) => `<textarea ${attrs}></textarea>${state}
<script>(()=>{const ta=document.querySelector('.composer textarea');const d=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
let tracked='',st='';Object.defineProperty(ta,'value',{configurable:true,get(){return d.get.call(this)},set(v){tracked=String(v);d.set.call(this,v)}});
ta.addEventListener('input',()=>{const v=d.get.call(ta);if(v!==tracked){tracked=v;st=v;window.__onChange();}});
window.__registered=()=>st;})();</script>`;
const page = (name, body, scripts = '') => `<!doctype html><html><head><meta charset="utf-8"><title>${name} (mock)</title>${css}${scripts}</head><body>${banner(name)}<div class="conv">Conversation area…</div>${body}</body></html>`;

module.exports = {
  'https://chatgpt.com/': page('ChatGPT', `<form class="composer"><textarea style="display:none" name="prompt-textarea"></textarea><div id="mount"></div>${state}</form>
    <script>mountPM(document.getElementById('mount'),{id:'prompt-textarea',contenteditable:'true','aria-label':'Message ChatGPT'});</script>`, '<script src="/__mock/pm.bundle.js"></script>'),
  'https://chat.openai.com/': page('ChatGPT (legacy textarea)', `<form class="composer">${reactTextarea('id="prompt-textarea" data-id="root" rows="2" placeholder="Message ChatGPT"')}</form>`),
  'https://claude.ai/new': page('Claude', `<fieldset class="composer" style="border:1px solid #ddd"><div id="mount"></div>${state}</fieldset>
    <script>mountPM(document.getElementById('mount'),{'aria-label':'Write your prompt to Claude',role:'textbox'});</script>`, '<script src="/__mock/pm.bundle.js"></script>'),
  'https://gemini.google.com/app': page('Gemini', `<div class="composer"><rich-textarea><div id="mount"></div></rich-textarea>${state}</div>
    <script>mountQuill(document.getElementById('mount'));const e=document.querySelector('.ql-editor');e.setAttribute('role','textbox');e.setAttribute('aria-label','Enter a prompt here');</script>`, '<script src="/__mock/quill.bundle.js"></script>'),
  'https://grok.com/': page('Grok', `<form class="composer">${reactTextarea('aria-label="Ask Grok anything" rows="2"')}</form>`),
  'https://x.com/i/grok': page('Grok on X', `<div class="composer">${reactTextarea('placeholder="Ask anything" rows="2"')}</div>`),
  'https://claude.ai/no-input': page('Claude (page without a prompt box)', `<div class="composer">No editable prompt box on this page.</div>`),
};
