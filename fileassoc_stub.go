//go:build !windows

package main

import "errors"

func assignStxtFileAssociation(string) error {
	return errors.New("file association support is currently available on Windows only")
}
