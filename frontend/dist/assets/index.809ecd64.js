(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const s of l.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function o(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerpolicy&&(l.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?l.credentials="include":n.crossorigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(n){if(n.ep)return;n.ep=!0;const l=o(n);fetch(n.href,l)}})();function T(t){return window.go.main.App.ChangeFile(t)}function k(){return window.go.main.App.GetCurrentFile()}function I(){return window.go.main.App.GetFiles()}function B(){return window.go.main.App.GetVersion()}function L(t,e){return window.go.main.App.SaveFile(t,e)}function C(t){return window.go.main.App.UnlockFile(t)}let h,v,m,y,u,E,c=[],r=-1,g=null,w;window.save=function(t){try{let e=document.getElementById("editor").innerHTML,o=u.value;L(e,o).then(i=>{i?m.innerText=i:m.innerText="File saved."})}catch(e){console.error(e)}};window.unlock=function(){let t=u.value;try{C(t).then(e=>{e.substring(0,1)==";"?(m.innerText="File loaded.",h.style.display="none",v.style.display="flex",document.getElementById("editor").innerHTML=e.substring(1),document.getElementById("editor").focus(),x(),w&&clearInterval(w),w=setInterval(x,3e4)):y.innerText=e}).catch(e=>{console.error(e)})}catch(e){console.error(e)}};function x(){I().then(t=>{!t||k().then(e=>{E.innerHTML="",t.forEach(o=>{const i=document.createElement("div");i.className="file-list-item",i.innerText=o,o===e&&i.classList.add("active"),i.onclick=()=>S(o),E.appendChild(i)})})})}function S(t){T(t).then(e=>{e.substring(0,1)==";"?(document.getElementById("editor").innerHTML=e.substring(1),m.innerText="File loaded.",x()):(v.style.display="none",h.style.display="flex",y.innerText="Password required for "+t,u.value="",u.focus())}).catch(e=>{v.style.display="none",h.style.display="flex",y.innerText="Error: "+e,u.value="",u.focus()})}window.formatTextInRealTime=function(){m.innerText="Changes unsaved.",document.execCommand("defaultParagraphSep",!1,"p")};window.formatText=function(t){document.execCommand(t,!1)};window.alignText=function(t){const o=window.getSelection().getRangeAt(0),i=o.cloneContents(),n=document.createElement("p");n.classList.add(t),n.appendChild(i),o.deleteContents(),o.insertNode(n)};document.querySelector("#app").innerHTML=`
    <div class="flex flex-col h-screen">
        <div class="flex-grow flex items-center justify-center" id="unlockBlock">
            <div class="unlock-container">
                <h1 class="unlock-title">pNotepad Plus</h1>
                <div class="result" id="result">Please enter your password</div>
                <form class="input-box" id="unlockForm" onsubmit="event.preventDefault(); unlock();">
                    <input class="input" id="password" type="password" autocomplete="off" placeholder="Enter password..." />
                    <button type="submit" class="btn">Unlock</button>
                </form>
            </div>
        </div>
        <div class="flex flex-col h-screen" id="editorBlock" style="display: none;">
            <div class="editor-layout">
                <div class="sidebar">
                    <div class="file-list-header">Files</div>
                    <div id="fileList"></div>
                </div>
                <div class="main-content">
                    <div class="editor-toolbar">
                        <div class="editor-buttons">
                            <button class="editor-button" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                            <button class="editor-button" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                            <button class="editor-button" onclick="alignText('align-left')"><i class="fas fa-align-left"></i></button>
                            <button class="editor-button" onclick="alignText('align-center')"><i class="fas fa-align-center"></i></button>
                            <button class="editor-button" onclick="alignText('align-right')"><i class="fas fa-align-right"></i></button>
                            <button id="openSearch" class="editor-button"><i class="fas fa-search"></i></button>
                            <button class="editor-button" onclick="save()">Save</button>
                        </div>
                    </div>
                    <div id="editor" contenteditable="true" spellcheck="false" oninput="formatTextInRealTime()" oncontextmenu="return true;"></div>
                    <div class="status-bar">
                        <span id="version"></span>
                        <span id="status"></span>
                    </div>
                </div>
            </div>
        </div>
        <div id="searchPopup" class="hidden fixed inset-0 z-50 flex items-center justify-center">
            <div class="bg-gray-800 p-4 rounded">
                <div class="flex gap-2 items-center">
                    <input type="text" id="searchInput" placeholder="Search..." class="search-input"/>
                    <button id="findBtn" class="search-button">Find</button>
                    <button id="nextBtn" class="search-button">Next</button>
                    <button id="closeBtn" class="search-button">Close</button>
                </div>
                <div id="matchCount" class="mt-2 text-sm text-gray-300"></div>
            </div>
        </div>
    </div>
`;document.addEventListener("DOMContentLoaded",function(){h=document.getElementById("unlockBlock"),v=document.getElementById("editorBlock"),m=document.getElementById("status"),y=document.getElementById("result"),u=document.getElementById("password"),E=document.getElementById("fileList"),setTimeout(()=>{u.focus()},100),B().then(o=>{document.getElementById("version").innerHTML=`v${o}`}),document.getElementById("findBtn").addEventListener("click",window.findText),document.getElementById("nextBtn").addEventListener("click",window.nextMatch),document.getElementById("openSearch").addEventListener("click",window.openSearchPopup),document.getElementById("closeBtn").addEventListener("click",window.closeSearchPopup),document.getElementById("searchInput").addEventListener("keydown",function(o){o.key==="Enter"?(o.preventDefault(),c.length>0?window.nextMatch():window.findText()):o.key==="Escape"&&(o.preventDefault(),window.closeSearchPopup())}),document.addEventListener("keydown",function(o){o.key==="F3"&&(o.preventDefault(),window.openSearchPopup())}),document.getElementById("editor").addEventListener("paste",function(o){o.preventDefault();const i=(o.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",!1,i),formatTextInRealTime()});const e=document.getElementById("searchPopup");e.addEventListener("click",function(o){o.target===e&&window.closeSearchPopup()})});window.escapeRegExp=function(t){return t.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")};window.findText=function(){const t=document.getElementById("searchInput").value,e=document.getElementById("editor");if(e.innerHTML=e.innerHTML.replace(/<mark class=\"search-highlight(?: current)?\">([^<]*)<\/mark>/g,"$1"),!t){c=[],r=-1,document.getElementById("matchCount").innerText="";return}if(t.length<2){document.getElementById("matchCount").innerText="Enter at least 2 characters";return}const o=new RegExp(window.escapeRegExp(t),"gi");e.innerHTML=e.innerHTML.replace(o,i=>`<mark class="search-highlight">${i}</mark>`),c=Array.from(e.querySelectorAll("mark.search-highlight")),r=0,document.getElementById("matchCount").innerText=`${c.length} matches`,c.length>0&&(c[0].classList.add("current"),c[0].scrollIntoView({behavior:"smooth",block:"center"}))};window.nextMatch=function(){c.length!==0&&(c[r].classList.remove("current"),r=(r+1)%c.length,c[r].classList.add("current"),c[r].scrollIntoView({behavior:"smooth",block:"center"}))};window.openSearchPopup=function(){document.getElementById("searchPopup").classList.remove("hidden");const e=document.getElementById("editor"),o=window.getSelection();o.rangeCount>0&&(g=o.getRangeAt(0).cloneRange());const i=document.getElementById("searchInput");i.value="",e.innerHTML=e.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g,"$1"),c=[],r=-1,document.getElementById("matchCount").innerText="",i.focus()};window.closeSearchPopup=function(){const t=document.getElementById("editor");let e=null;if(r>=0&&c.length>0){let a=function(d){if(!s){if(d.nodeType===Node.TEXT_NODE)l+=d.length;else if(d===n)l+=n.textContent.length,s=!0;else if(d.nodeType===Node.ELEMENT_NODE){for(let p of d.childNodes)if(a(p),s)break}}};var o=a;const n=c[r];let l=0,s=!1;a(t),s&&(e=l)}else if(g)try{const n=document.createRange();n.setStart(t,0),n.setEnd(g.startContainer,g.startOffset),e=n.toString().length}catch{console.log("Could not calculate saved selection offset")}if(t.innerHTML=t.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g,"$1"),c=[],r=-1,document.getElementById("matchCount").innerText="",document.getElementById("searchPopup").classList.add("hidden"),t.focus(),e!==null)try{let p=function(f){if(!a){if(f.nodeType===Node.TEXT_NODE)s+f.length>=e?(a=f,d=e-s):s+=f.length;else if(f.nodeType===Node.ELEMENT_NODE){for(let b of f.childNodes)if(p(b),a)break}}};var i=p;const n=window.getSelection(),l=document.createRange();let s=0,a=null,d=0;p(t),a&&(l.setStart(a,d),l.collapse(!0),n.removeAllRanges(),n.addRange(l))}catch(n){console.log("Could not restore cursor position:",n)}g=null};
