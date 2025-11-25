import './style.css';
import './app.css';

import {UnlockFile, SaveFile, GetVersion, GetFiles, ChangeFile, GetCurrentFile, CreateNewFile, AssignFileAssociation, SaveAsNewPassword} from '../wailsjs/go/main/App';

// Variables globales
let unlockBlock, editorBlock, statusElement, resultElement, passwordElement, fileListElement;
let matches = [], currentMatch = -1;
let savedSelection = null;
let refreshInterval;
let hasUnsavedChanges = false;
let originalContent = "";

window.save = function(content) {
    try {
        let text = document.getElementById("editor").innerHTML;
        let password = passwordElement.value;
        SaveFile(text, password).then((result) => {
            if (result) {
                statusElement.innerText = result;
            } else {
                statusElement.innerText = "File saved.";
                // Reset unsaved changes flag after successful save
                hasUnsavedChanges = false;
                originalContent = text;
            }
        });
    } catch (err) {
        console.error(err);
    }
}

window.saveWithNewPassword = function() {
    try {
        const newPassword = prompt("Enter new password for this file:");
        if (newPassword === null) {
            return; // User cancelled
        }
        
        if (newPassword.trim() === "") {
            statusElement.innerText = "Password cannot be empty.";
            return;
        }
        
        const confirmNewPassword = prompt("Confirm new password:");
        if (confirmNewPassword === null) {
            return; // User cancelled
        }
        
        if (newPassword !== confirmNewPassword) {
            statusElement.innerText = "Passwords do not match.";
            return;
        }
        
        let text = document.getElementById("editor").innerHTML;
        SaveAsNewPassword(text, newPassword).then((result) => {
            if (result) {
                statusElement.innerText = result;
            } else {
                statusElement.innerText = "File saved with new password.";
                // Update password field and reset unsaved changes
                passwordElement.value = newPassword;
                hasUnsavedChanges = false;
                originalContent = text;
            }
        }).catch((err) => {
            statusElement.innerText = "Error: " + err;
        });
    } catch (err) {
        console.error(err);
        statusElement.innerText = "Error saving with new password.";
    }
}

window.createNewFile = function () {
    // Check for unsaved changes before creating new file
    if (hasUnsavedChanges) {
        const shouldSave = confirm("You have unsaved changes. Do you want to save before creating a new file?");
        if (shouldSave) {
            // Save current file first
            const currentContent = document.getElementById("editor").innerHTML;
            const password = passwordElement.value;
            SaveFile(currentContent, password).then((result) => {
                if (result) {
                    statusElement.innerText = result;
                } else {
                    statusElement.innerText = "File saved.";
                }
                // Continue with new file creation after saving
                performNewFileCreation();
            }).catch((err) => {
                console.error("Error saving file:", err);
                // Still ask if user wants to continue without saving
                const continueWithoutSave = confirm("Error saving file. Do you want to continue creating a new file without saving?");
                if (continueWithoutSave) {
                    performNewFileCreation();
                }
            });
            return; // Exit early, performNewFileCreation will be called after save
        } else {
            // User chose not to save, continue with new file creation
            const confirmContinue = confirm("Are you sure you want to create a new file without saving your changes?");
            if (!confirmContinue) {
                return; // Cancel the new file creation
            }
        }
    }
    
    // No unsaved changes or user confirmed to proceed without saving
    performNewFileCreation();
}

function performNewFileCreation() {
    const proposedName = prompt('New file name (optional):', '');
    if (proposedName === null) {
        return;
    }

    CreateNewFile(proposedName)
        .then((result) => {
            if (result.substring(0,1)==";") {
                document.getElementById("editor").innerHTML = result.substring(1);
                statusElement.innerText = "New file created.";
                refreshFileList();
                // Reset unsaved changes tracking for new file
                hasUnsavedChanges = false;
                originalContent = result.substring(1);
            } else {
                resultElement.innerText = result || "Could not create file.";
            }
        })
        .catch((err) => {
            resultElement.innerText = "Error: " + err;
        });
}

window.unlock = function () {
    let password = passwordElement.value;

    try {
        UnlockFile(password)
            .then((result) => {
                if (result.substring(0,1)==";") {
                    statusElement.innerText = "File loaded.";
                    unlockBlock.style.display = "none";
                    editorBlock.style.display = "flex";
                    document.getElementById("editor").innerHTML = result.substring(1);
                    document.getElementById("editor").focus();
                    
                    // Set original content for change tracking
                    originalContent = result.substring(1);
                    hasUnsavedChanges = false;
                    
                    // Start sidebar refresh
                    refreshFileList();
                    if (refreshInterval) clearInterval(refreshInterval);
                    refreshInterval = setInterval(refreshFileList, 30000);
                } else {
                    resultElement.innerText = result;
                }
            })
            .catch((err) => {
                console.error(err);
            });
    } catch (err) {
        console.error(err);
    }
};

// Function to refresh file list
function refreshFileList() {
    GetFiles().then((files) => {
        if (!files) return;
        
        // Get current file to highlight
        GetCurrentFile().then((currentFile) => {
            fileListElement.innerHTML = '';
            files.forEach(file => {
                const div = document.createElement('div');
                div.className = 'file-list-item';
                div.innerText = file;
                if (file === currentFile) {
                    div.classList.add('active');
                }
                div.onclick = () => switchFile(file);
                fileListElement.appendChild(div);
            });
        });
    });
}

// Function to switch file
function switchFile(filename) {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges) {
        const shouldSave = confirm(`You have unsaved changes. Do you want to save before switching to ${filename}?`);
        if (shouldSave) {
            // Save current file first
            const currentContent = document.getElementById("editor").innerHTML;
            const password = passwordElement.value;
            SaveFile(currentContent, password).then((result) => {
                if (result) {
                    statusElement.innerText = result;
                } else {
                    statusElement.innerText = "File saved.";
                }
                // Continue with file switch after saving
                performFileSwitch(filename);
            }).catch((err) => {
                console.error("Error saving file:", err);
                // Still ask if user wants to continue without saving
                const continueWithoutSave = confirm(`Error saving file. Do you want to continue switching to ${filename} without saving?`);
                if (continueWithoutSave) {
                    performFileSwitch(filename);
                }
            });
            return; // Exit early, performFileSwitch will be called after save
        } else {
            // User chose not to save, continue with switch
            const confirmSwitch = confirm(`Are you sure you want to switch to ${filename} without saving your changes?`);
            if (!confirmSwitch) {
                return; // Cancel the switch
            }
        }
    }
    
    // No unsaved changes or user confirmed to proceed without saving
    performFileSwitch(filename);
}

function performFileSwitch(filename) {
    ChangeFile(filename).then((result) => {
        if (result.substring(0,1)==";") {
            // Success with current password
            document.getElementById("editor").innerHTML = result.substring(1);
            statusElement.innerText = "File loaded.";
            refreshFileList(); // Update active state
            // Reset unsaved changes tracking
            hasUnsavedChanges = false;
            originalContent = result.substring(1);
        } else {
            // Failed, likely password difference. Show unlock screen.
            // The backend already updated the filename.
            editorBlock.style.display = "none";
            unlockBlock.style.display = "flex";
            resultElement.innerText = "Password required for " + filename;
            passwordElement.value = ""; // Clear password
            passwordElement.focus();
        }
    }).catch((err) => {
        // Error loading file, maybe show unlock screen
        editorBlock.style.display = "none";
        unlockBlock.style.display = "flex";
        resultElement.innerText = "Error: " + err;
        passwordElement.value = ""; 
        passwordElement.focus();
    });
}

// editor
window.formatTextInRealTime = function () {
    // Check if content has actually changed
    const currentContent = document.getElementById("editor").innerHTML;
    if (currentContent !== originalContent) {
        hasUnsavedChanges = true;
        statusElement.innerText = "Changes unsaved.";
    }
    document.execCommand('defaultParagraphSep', false, 'p');
}

// Función para aplicar formato de texto
window.formatText = function (type) {
    document.execCommand(type, false);
}

// Alinear texto
window.alignText = function (alignment) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const clonedContents = range.cloneContents();
    const p = document.createElement('p');
    p.classList.add(alignment);
    p.appendChild(clonedContents);
    range.deleteContents();
    range.insertNode(p);
}

document.querySelector('#app').innerHTML = `
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
                    <div class="sidebar-footer">
                        <button class="sidebar-new-button" onclick="createNewFile()">+ New File</button>
                        <button class="sidebar-associate-button" onclick="assignAssociation()" title="Assign .stxt files" aria-label="Assign .stxt files">🗃️</button>
                    </div>
                </div>
                <div class="main-content">
                    <div class="editor-toolbar">
                        <div class="editor-buttons">
                            <button class="editor-button" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                            <button class="editor-button" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                            <button class="editor-button" onclick="alignText('align-left')"><i class="fas fa-align-left"></i></button>
                            <button class="editor-button" onclick="alignText('align-center')"><i class="fas fa-align-center"></i></button>
                            <button class="editor-button" onclick="alignText('align-right')"><i class="fas fa-align-right"></i></button>
                            <button id="toggleSearch" class="editor-button" title="Toggle Search"><i class="fas fa-search"></i></button>
                            <button class="editor-button" onclick="save()">Save</button>
                            <button class="editor-button" onclick="saveWithNewPassword()" title="Save with New Password">🔐</button>
                        </div>
                    </div>
                    <div id="searchBar" class="search-bar hidden">
                        <input type="text" id="searchInput" placeholder="Find..." class="search-input"/>
                        <span id="matchCount" class="search-count"></span>
                        <div class="search-actions">
                            <button id="findPrevBtn" class="search-button" title="Previous"><i class="fas fa-chevron-up"></i></button>
                            <button id="findNextBtn" class="search-button" title="Next"><i class="fas fa-chevron-down"></i></button>
                            <button id="closeSearchBtn" class="search-button" title="Close"><i class="fas fa-times"></i></button>
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
    </div>
`;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar variables globales
    unlockBlock = document.getElementById("unlockBlock");
    editorBlock = document.getElementById("editorBlock");
    statusElement = document.getElementById("status");
    resultElement = document.getElementById("result");
    passwordElement = document.getElementById("password");
    fileListElement = document.getElementById("fileList");
    
    // Set focus after a small delay to ensure the element is ready
    setTimeout(() => {
        passwordElement.focus();
    }, 100);

    // Load version
    GetVersion().then((version) => {
        document.getElementById("version").innerHTML = `v${version}`;
    });

    // Search UI event listeners
    // document.getElementById('findBtn').addEventListener('click', window.findText); // Removed
    document.getElementById('findNextBtn').addEventListener('click', window.nextMatch);
    document.getElementById('findPrevBtn').addEventListener('click', window.prevMatch);
    document.getElementById('toggleSearch').addEventListener('click', window.toggleSearch);
    document.getElementById('closeSearchBtn').addEventListener('click', window.closeSearch);
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                 window.prevMatch();
            } else {
                 // If there are already matches, go to next; otherwise, search
                if (matches.length > 0) {
                    window.nextMatch();
                } else {
                    window.findText();
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            window.closeSearch();
        } else {
            // Auto-search on typing (debounce could be added but let's keep it simple for now)
            // window.findText(); 
            // Actually, let's wait for Enter for findText to avoid flashing, 
            // but user might expect realtime. Let's stick to Enter for now as per original design
            // or enable realtime if requested. The original was "Find" button or Enter.
        }
    });
    
    // Realtime search on input
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const term = this.value;
        if (term.length >= 2) {
             window.findText();
        } else {
            // Clear if empty
            if (term.length === 0) {
                 // Clear highlights without closing
                 const editor = document.getElementById('editor');
                 editor.innerHTML = editor.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g, '$1');
                 matches = [];
                 currentMatch = -1;
                 document.getElementById('matchCount').innerText = '';
            }
        }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // F3 to open search or next match
        if (e.key === 'F3') {
            e.preventDefault();
            if (document.getElementById('searchBar').classList.contains('hidden')) {
                window.toggleSearch();
            } else {
                if (e.shiftKey) {
                    window.prevMatch();
                } else {
                    window.nextMatch();
                }
            }
        }
        
        // Ctrl+F
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
             e.preventDefault();
             window.toggleSearch();
        }

        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            window.assignAssociation();
        }
    });

    // Editor-specific paste handling
    const editor = document.getElementById('editor');
    
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        
        // Get plain text from clipboard
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        
        // Use execCommand to insert text so it's added to undo history
        document.execCommand('insertText', false, text);
        
        // Trigger the input event to mark as unsaved
        formatTextInRealTime();
    });

    // Close popup on outside click - REMOVED for integrated bar
    // We want it to stay open
    
    const associateButton = document.querySelector('.sidebar-associate-button');
    if (associateButton) {
        associateButton.addEventListener('focus', (e) => e.target.blur());
    }
});

window.assignAssociation = function() {
    if (!window.confirm('Do you want to associate .stxt files with pNotepad Plus?')) {
        return;
    }
    const statusArea = document.getElementById('status');
    statusArea.innerText = 'Assigning .stxt handler...';
    AssignFileAssociation()
        .then((result) => {
            if (result) {
                statusArea.innerText = result;
            } else {
                statusArea.innerText = '.stxt association updated.';
            }
        })
        .catch((err) => {
            statusArea.innerText = 'Could not assign file association: ' + err;
        });
};

// Utility to escape regex special characters
window.escapeRegExp = function(string) {
    return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
};

// Function to find and highlight matches
window.findText = function() {
    const term = document.getElementById('searchInput').value;
    const editor = document.getElementById('editor');
    
    // First, strip existing highlights to search in clean text
    // This is crucial to avoid matching inside HTML tags or double marking
    const content = editor.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g, '$1');
    
    if (!term || term.length < 2) {
        editor.innerHTML = content; // Cleaned content
        matches = [];
        currentMatch = -1;
        document.getElementById('matchCount').innerText = '';
        return;
    }
    
    const regex = new RegExp(`(${window.escapeRegExp(term)})`, 'gi');
    // We need to be careful not to replace inside HTML tags if there are any (like <p> or <div>)
    // But pNotepad uses execCommand which might insert <br> or <div>.
    // Simple replacement on innerHTML is risky if matches overlap with tags.
    // However, assuming simple text for now or careful regex.
    
    // A safer approach for highlighting:
    // 1. Split by tags? No, too complex.
    // 2. Use the existing approach but careful.
    
    const newContent = content.replace(regex, '<mark class="search-highlight">$1</mark>');
    editor.innerHTML = newContent;
    
    matches = Array.from(editor.querySelectorAll('mark.search-highlight'));
    currentMatch = 0;
    document.getElementById('matchCount').innerText = `${matches.length} matches`;
    if (matches.length > 0) {
        matches[0].classList.add('current');
        matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        document.getElementById('matchCount').innerText = 'No matches';
    }
};

// Function to navigate to next match
window.nextMatch = function() {
    if (matches.length === 0) {
        window.findText();
        return;
    }
    matches[currentMatch].classList.remove('current');
    currentMatch = (currentMatch + 1) % matches.length;
    matches[currentMatch].classList.add('current');
    matches[currentMatch].scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Function to navigate to previous match
window.prevMatch = function() {
    if (matches.length === 0) return;
    matches[currentMatch].classList.remove('current');
    currentMatch = (currentMatch - 1 + matches.length) % matches.length;
    matches[currentMatch].classList.add('current');
    matches[currentMatch].scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Search Bar control functions
window.toggleSearch = function() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar.classList.contains('hidden')) {
        searchBar.classList.remove('hidden');
        const searchInput = document.getElementById('searchInput');
        searchInput.focus();
        searchInput.select();
        if (searchInput.value.length >= 2) {
            window.findText();
        }
    } else {
        window.closeSearch();
    }
};

window.closeSearch = function() {
    const editor = document.getElementById('editor');
    const searchBar = document.getElementById('searchBar');
    
    // If not hidden, hide it
    searchBar.classList.add('hidden');
    
    // We want to remove highlights but keep cursor at the current match if possible.
    if (matches.length > 0 && currentMatch >= 0 && matches[currentMatch]) {
        const currentElement = matches[currentMatch];
        
        // Insert a temporary marker
        const marker = document.createElement('span');
        marker.id = 'cursor-temp-marker';
        marker.innerText = '\u200B'; // Zero-width space
        
        // Insert marker before the current match text
        currentElement.parentNode.insertBefore(marker, currentElement);
        
        // Now replace all marks
        editor.innerHTML = editor.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g, '$1');
        
        // Find marker
        const foundMarker = document.getElementById('cursor-temp-marker');
        if (foundMarker) {
            // Restore cursor
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStartAfter(foundMarker);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Remove marker
            foundMarker.remove();
            
            // Ensure we focus editor
            editor.focus();
        } else {
             // Fallback
             editor.focus();
        }
    } else {
        // Just clear and focus
        editor.innerHTML = editor.innerHTML.replace(/<mark class="search-highlight(?: current)?">([^<]*)<\/mark>/g, '$1');
        editor.focus();
    }
    
    matches = [];
    currentMatch = -1;
    document.getElementById('matchCount').innerText = '';
};

