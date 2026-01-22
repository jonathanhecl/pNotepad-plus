package main

import (
	"embed"
	"flag"
	"os"
	"path/filepath"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

var (
	version  string = "2.0.1"
	filename string
)

func main() {
	// Default notes file next to the executable
	execPath, err := os.Executable()
	if err != nil {
		execPath = "."
	} else {
		execPath = filepath.Dir(execPath)
	}
	defaultPath := filepath.Join(execPath, "notes.stxt")
	flag.StringVar(&filename, "file", defaultPath, "Path to the notes file")
	flag.Parse()

	// Check command line arguments for file path in Windows
	if runtime.GOOS == "windows" && len(os.Args) > 1 && os.Args[1] != "-file" {
		filename = os.Args[1]
	}

	// Normalize path
	absPath, err := filepath.Abs(filename)
	if err == nil {
		filename = absPath
	}

	// Create an instance of the app structure
	app := NewApp()

	app.Filename = filename
	app.Directory = filepath.Dir(filename)
	app.Version = version

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "pNotepad Plus (" + filepath.Base(filename) + ")",
		Width:  1200,
		Height: 768,
		Mac: &mac.Options{
			OnFileOpen: func(filePath string) {
				app.Filename = filePath
				app.Directory = filepath.Dir(filePath)
				_, _ = app.TryLoad()
			},
		},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "f4095f19-39ed-5f4e-c81b-56fa72690ded",
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
