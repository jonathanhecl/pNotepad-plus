# pNotepad Plus

pNotepad Plus is a secure, encrypted text editor built with Go and Wails. It is an evolution of pNotepad, adding features for file navigation and management within encrypted directories.

## Features

-   **Encrypted Storage**: Files are encrypted using AES-GCM with PBKDF2 key derivation.
-   **File Sidebar**: Automatically lists other `.stxt` files in the same directory as the opened file.
-   **Seamless Switching**: Switch between files sharing the same password without re-entering credentials.
-   **Auto Refresh**: The file list refreshes automatically every 30 seconds to show new files.
-   **Search**: Built-in search functionality (F3).
-   **Rich Text Support**: Basic formatting (Bold, Italic, Alignment) is supported in the editor.

## Usage

1.  Open the application.
2.  Enter a password to unlock the current file.
3.  Use the sidebar to navigate between other encrypted files in the same folder.
4.  If a file uses a different password, you will be prompted to unlock it.

## Development

### Prerequisites

-   Go 1.21+
-   Node.js and npm

### Build

```bash
wails build
```

### Run

```bash
wails dev
```
