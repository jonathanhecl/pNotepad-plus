//go:build windows

package main

import (
	"fmt"
	"strings"
	"syscall"

	"golang.org/x/sys/windows/registry"
)

const (
	stxtExtension = ".stxt"
	stxtProgID    = "pNotepadPlus.stxt"
)

func assignStxtFileAssociation(executable string) error {
	execPath := strings.TrimSpace(executable)
	if execPath == "" {
		return fmt.Errorf("invalid executable path")
	}

	if err := setRegistryString(registry.CURRENT_USER, `Software\\Classes\\`+stxtExtension, "", stxtProgID); err != nil {
		return err
	}

	if err := setRegistryBinary(registry.CURRENT_USER, `Software\\Classes\\`+stxtExtension+`\\OpenWithProgids`, stxtProgID, []byte{}); err != nil {
		return err
	}

	if err := setRegistryString(registry.CURRENT_USER, `Software\\Classes\\`+stxtProgID, "", "Secure Text Document"); err != nil {
		return err
	}

	if err := setRegistryString(registry.CURRENT_USER, `Software\\Classes\\`+stxtProgID+`\\DefaultIcon`, "", fmt.Sprintf("\"%s\",0", execPath)); err != nil {
		return err
	}

	if err := setRegistryString(registry.CURRENT_USER, `Software\\Classes\\`+stxtProgID+`\\shell\\open\\command`, "", fmt.Sprintf("\"%s\" \"%%1\"", execPath)); err != nil {
		return err
	}

	notifyExplorerFileAssociationsChanged()
	return nil
}

func setRegistryString(root registry.Key, path, name, value string) error {
	key, _, err := registry.CreateKey(root, path, registry.CREATE_SUB_KEY|registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	return key.SetStringValue(name, value)
}

func setRegistryBinary(root registry.Key, path, name string, value []byte) error {
	key, _, err := registry.CreateKey(root, path, registry.CREATE_SUB_KEY|registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	return key.SetBinaryValue(name, value)
}

func notifyExplorerFileAssociationsChanged() {
	const (
		shcneAssocChanged = 0x08000000
		shcnfIdList       = 0x0000
	)

	shell32 := syscall.NewLazyDLL("shell32.dll")
	proc := shell32.NewProc("SHChangeNotify")
	_, _, _ = proc.Call(uintptr(shcneAssocChanged), uintptr(shcnfIdList), 0, 0)
}
