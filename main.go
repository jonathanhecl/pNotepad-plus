package main

import (
	"embed"
	"fmt"
)

//go:embed all:frontend/dist
var assets embed.FS

var (
	version string = "2.0.0"
)

func main() {
	fmt.Println("Hello, World!")
}
