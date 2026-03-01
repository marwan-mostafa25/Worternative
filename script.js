// Initialize Editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: { toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'clean']
    ]}
});

const titleInput = document.getElementById('doc-title');
const tabBar = document.getElementById('tab-bar');

let docs = JSON.parse(localStorage.getItem('openword_docs')) || [];
let activeDocId = null;
let isSwitching = false;

// Boot up
if (docs.length === 0) createNewDoc("Untitled Document", "");
else switchDoc(docs[0].id);

// Save to Local Storage
function saveState() {
    if (isSwitching || !activeDocId) return;
    const activeDoc = docs.find(d => d.id === activeDocId);
    if (activeDoc) {
        activeDoc.title = titleInput.value;
        activeDoc.content = quill.root.innerHTML;
        localStorage.setItem('openword_docs', JSON.stringify(docs));
    }
}

quill.on('text-change', saveState);
titleInput.addEventListener('input', () => { saveState(); renderTabs(); });

// Tab Rendering
function renderTabs() {
    tabBar.innerHTML = '';
    docs.forEach(doc => {
        const tab = document.createElement('div');
        tab.className = `tab ${doc.id === activeDocId ? 'active' : ''}`;
        tab.onclick = () => switchDoc(doc.id);
        
        let displayTitle = doc.title || 'Untitled';
        if(displayTitle.length > 20) displayTitle = displayTitle.substring(0, 20) + '...';

        tab.innerHTML = `
            <span>${displayTitle}</span>
            <span class="tab-close" onclick="closeDoc(event, '${doc.id}')">×</span>
        `;
        tabBar.appendChild(tab);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'tab tab-new';
    addBtn.innerHTML = '+ New';
    addBtn.onclick = () => createNewDoc("Untitled Document", "");
    tabBar.appendChild(addBtn);
}

// Document Management
function createNewDoc(title, content) {
    const newId = Date.now().toString();
    docs.push({ id: newId, title: title, content: content });
    switchDoc(newId);
}

function switchDoc(id) {
    if (activeDocId) saveState();
    isSwitching = true;
    activeDocId = id;
    const targetDoc = docs.find(d => d.id === id);
    if (targetDoc) {
        titleInput.value = targetDoc.title;
        quill.root.innerHTML = targetDoc.content;
    }
    renderTabs();
    isSwitching = false;
}

function closeDoc(event, id) {
    event.stopPropagation();
    if (docs.length <= 1) { alert("You must have at least one document open."); return; }
    if (confirm("Close this document?")) {
        docs = docs.filter(d => d.id !== id);
        if (activeDocId === id) switchDoc(docs[0].id);
        else { renderTabs(); saveState(); }
    }
}

// File Importing
document.getElementById('upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const newTitle = file.name.replace('.docx', '');
    const reader = new FileReader();
    reader.onload = function(event) {
        mammoth.convertToHtml({arrayBuffer: event.target.result})
            .then(result => createNewDoc(newTitle, result.value))
            .catch(err => alert("Could not load the .docx file."));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
});

// HTML Export
function downloadHTML() {
    const content = quill.root.innerHTML;
    const title = titleInput.value || 'document';
    const htmlString = `<!DOCTYPE html><html><head><title>${title}</title><meta charset="utf-8"></head><body style="font-family: Arial; padding: 40px; max-width: 800px; margin: auto;">${content}</body></html>`;
    const blob = new Blob([htmlString], {type: "text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
