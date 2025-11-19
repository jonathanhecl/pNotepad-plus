package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	headerEncrypted = []byte("pN\x00\x00\x01")
)

// App struct
type App struct {
	ctx       context.Context
	Filename  string
	Directory string
	Version   string
	Password  string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) UnlockFile(password string) string {
	a.Password = password
	content, err := a.TryLoad()
	if err != nil {
		return err.Error()
	}

	return ";" + content
}

func (a *App) GetVersion() string {
	return a.Version
}

func (a *App) SaveFile(content, password string) error {
	if password == "" {
		password = a.Password
	}
	var encrypted []byte
	if a.Password != "" {
		encrypted = headerEncrypted
		encryptedData, err := encrypt([]byte(content), password)
		if err != nil {
			return err
		}
		encrypted = append(encrypted, encryptedData...)
	} else {
		encrypted = []byte(content)
	}

	err := os.WriteFile(a.Filename, encrypted, 0644)
	if err != nil {
		return err
	}

	return nil
}

func (a *App) TryLoad() (string, error) {
	if _, err := os.Stat(a.Filename); os.IsNotExist(err) {
		file, err := os.Create(a.Filename)
		if err != nil {
			return "", fmt.Errorf("failed to create file: %v", err)
		}
		file.Close()

		return "", nil
	}

	var content string = ""

	data, err := os.ReadFile(a.Filename)
	if err != nil {
		return "", err
	}

	// Only attempt decryption if header prefix present
	if len(data) >= len(headerEncrypted) && bytes.Equal(data[:len(headerEncrypted)], headerEncrypted) {
		if a.Password == "" {
			return "", errors.New("invalid password")
		}

		data = data[len(headerEncrypted):]

		decrypted, err := decrypt(data, a.Password)
		if err != nil {
			fmt.Println("Error decrypting file:", err)
			return "", err
		}

		content = string(decrypted)
	} else {
		content = string(data)
	}

	return content, nil
}

// New methods for Sidebar

// GetFiles returns a list of files in the current directory
func (a *App) GetFiles() ([]string, error) {
	if a.Directory == "" {
		return []string{}, nil
	}

	entries, err := os.ReadDir(a.Directory)
	if err != nil {
		return nil, err
	}

	var files []string
	ext := filepath.Ext(a.Filename)

	for _, entry := range entries {
		if !entry.IsDir() {
			if filepath.Ext(entry.Name()) == ext {
				files = append(files, entry.Name())
			}
		}
	}

	sort.Strings(files)
	return files, nil
}

func (a *App) GetCurrentFile() string {
	return filepath.Base(a.Filename)
}

func (a *App) ChangeFile(filename string) (string, error) {
	newPath := filepath.Join(a.Directory, filename)

	// Check if file exists
	if _, err := os.Stat(newPath); os.IsNotExist(err) {
		return "", err
	}

	// Update current filename
	a.Filename = newPath

	// Update title
	runtime.WindowSetTitle(a.ctx, "pNotepad Plus ("+filename+")")

	// Try to load with current password
	content, err := a.TryLoad()
	if err != nil {
		return "", err
	}

	// If successful, return content prefixed with ; like UnlockFile
	return ";" + content, nil
}
